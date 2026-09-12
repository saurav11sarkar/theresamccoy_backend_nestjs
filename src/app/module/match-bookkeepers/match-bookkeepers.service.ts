import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Bookkeeper,
  BookkeeperDocument,
} from '../bookkeeper/entities/bookkeeper.entity';
import {
  Businesswoner,
  BusinesswonerDocument,
  BusinesswonerStatus,
} from '../businesswoner/entities/businesswoner.entity';

interface MatchOptions {
  searchTerm?: string;
  page?: string;
  limit?: string;
}

@Injectable()
export class MatchBookkeepersService {
  constructor(
    @InjectModel(Bookkeeper.name)
    private readonly bookkeeperModel: Model<BookkeeperDocument>,
    @InjectModel(Businesswoner.name)
    private readonly businesswonerModel: Model<BusinesswonerDocument>,
  ) {}

  async getMatches(userId: string, options: MatchOptions) {
    const business = await this.businesswonerModel.findOne({
      userId,
      status: BusinesswonerStatus.APPROVED,
    });

    if (!business) {
      throw new HttpException(
        'Approved business owner application not found',
        HttpStatus.FORBIDDEN,
      );
    }

    const searchTerm = options.searchTerm?.trim();
    const search = searchTerm
      ? {
          $or: [
            'firstName',
            'lastName',
            'city',
            'state',
            'industryExperience',
          ].map((field) => ({
            [field]: { $regex: searchTerm, $options: 'i' },
          })),
        }
      : {};

    const bookkeepers = await this.bookkeeperModel
      .find(search)
      .populate('userId', 'profilePicture')
      .lean();

    const ranked = bookkeepers
      .map((bookkeeper) => this.calculateMatch(business, bookkeeper))
      .sort((a, b) => b.matchScore - a.matchScore);

    const page = Math.max(Number(options.page) || 1, 1);
    const limit = Math.min(Math.max(Number(options.limit) || 10, 1), 100);
    const total = ranked.length;
    const start = (page - 1) * limit;

    return {
      data: ranked.slice(start, start + limit),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  private calculateMatch(business: BusinesswonerDocument, bookkeeper: object) {
    const profile = bookkeeper as Record<string, unknown>;
    let score = 0;
    const matchedOn: string[] = [];

    if (this.overlaps([business.industry], [profile.industryExperience])) {
      score += 25;
      matchedOn.push('Industry experience');
    }

    if (
      this.overlaps(
        [...business.servicesYouAreLookingFor, ...business.engagementTypes],
        [profile.bookkeepingselect, profile.specialyTrackInterest],
      )
    ) {
      score += 30;
      matchedOn.push('Bookkeeping services');
    }

    if (this.matchesSoftware(business.currentSystem, profile)) {
      score += 20;
      matchedOn.push('Accounting software');
    }

    if (
      this.workArrangementMatches(
        business.onsiteOrVirtual,
        profile.workArrangement,
      )
    ) {
      score += 15;
      matchedOn.push('Work arrangement');
    }

    if (this.overlaps([business.supportType], [profile.engagmentType])) {
      score += 10;
      matchedOn.push('Engagement type');
    }

    return { bookkeeper, matchScore: score, matchedOn };
  }

  private matchesSoftware(system: string, bookkeeper: Record<string, unknown>) {
    const softwareFields: Record<string, string[]> = {
      quickbooks: ['quiceBooksOnline', 'quickBooksDesktop'],
      xero: ['xero'],
      freshbooks: ['freshBooks'],
      wave: ['waveAccounting'],
      excel: ['excelSheets'],
      bill: ['billMemo'],
      gusto: ['gusto'],
    };
    const requested = this.normalize(system);

    return Object.entries(softwareFields).some(
      ([name, fields]) =>
        requested.includes(name) &&
        fields.some((field) => this.hasValue(bookkeeper[field])),
    );
  }

  private workArrangementMatches(wanted: string, offered: unknown) {
    const requested = this.normalize(wanted);
    const available = this.normalize(offered);
    if (!requested || !available) return false;
    if (requested.includes('hybrid')) {
      return available.includes('hybrid');
    }
    if (requested.includes('virtual')) {
      return available.includes('remote') || available.includes('virtual');
    }
    return this.textMatches(requested, available);
  }

  private overlaps(left: unknown[], right: unknown[]) {
    const leftValues = left.flatMap((value) =>
      Array.isArray(value) ? value : [value],
    );
    const rightValues = right.flatMap((value) =>
      Array.isArray(value) ? value : [value],
    );

    return leftValues.some((a) =>
      rightValues.some((b) =>
        this.textMatches(this.normalize(a), this.normalize(b)),
      ),
    );
  }

  private textMatches(a: string, b: string) {
    if (!a || !b) return false;
    return (
      a.includes(b) ||
      b.includes(a) ||
      a.split(' ').some((word) => word.length > 3 && b.includes(word))
    );
  }

  private normalize(value: unknown) {
    return typeof value === 'string'
      ? value
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, ' ')
          .trim()
      : '';
  }

  private hasValue(value: unknown) {
    const normalized = this.normalize(value);
    return Boolean(normalized && !['none', 'no', 'n a'].includes(normalized));
  }
}

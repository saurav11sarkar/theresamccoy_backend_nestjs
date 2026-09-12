import { MeetingScheduleService } from './meeting-schedule.service';
import { Model } from 'mongoose';
describe('pre-meeting workflow', () => {
  it('rejects pending and rejected requests', async () => {
    for (const status of ['pending', 'rejected']) {
      const create = jest.fn();
      const service = new MeetingScheduleService(
        { create } as unknown as Model<any>,
        {
          findById: jest.fn(async () => ({ status })),
        } as unknown as Model<any>,
        {} as Model<any>,
        {} as Model<any>,
      );
      await expect(
        service.scheduleMeeting('request', {
          date: '2026-10-01',
          time: '12:00',
          meetingLink: 'https://example.com',
        }),
      ).rejects.toThrow();
      expect(create).not.toHaveBeenCalled();
    }
  });
  it('records completion only from scheduled state with an accepted request', async () => {
    const update = jest.fn(async () => ({ status: 'completed' }));
    const service = new MeetingScheduleService(
      {
        findById: jest.fn(async () => ({
          _id: 'meeting',
          requestId: 'request',
          status: 'scheduled',
        })),
        findOneAndUpdate: update,
      } as unknown as Model<any>,
      {
        findById: jest.fn(async () => ({ status: 'accepted' })),
      } as unknown as Model<any>,
      {} as Model<any>,
      {} as Model<any>,
    );
    await expect(
      service.changeMeetingStatus('507f1f77bcf86cd799439011', 'invalid', {
        id: 'admin',
        role: 'admin',
      }),
    ).rejects.toThrow();
    await service.changeMeetingStatus('507f1f77bcf86cd799439011', 'completed', {
      id: 'admin',
      role: 'admin',
    });
    expect(update).toHaveBeenCalledWith(
      { _id: 'meeting', status: 'scheduled' },
      { $set: { status: 'completed', completedAt: expect.any(Date) } },
      expect.any(Object),
    );
  });
});

describe('meeting status participant authorization', () => {
  const id = '507f1f77bcf86cd799439011';

  function setup(role: string, ownsMeeting: boolean, status = 'scheduled') {
    const update = jest.fn(async () => ({ status: 'cancelled' }));
    const profile = {
      findOne: jest.fn(async () => ({
        _id: ownsMeeting ? 'participant' : 'other',
      })),
    };
    const service = new MeetingScheduleService(
      {
        findById: jest.fn(async () => ({
          _id: id,
          requestId: 'request',
          businessId: 'participant',
          bookkeeperId: 'participant',
          status,
        })),
        findOneAndUpdate: update,
      } as unknown as Model<any>,
      {
        findById: jest.fn(async () => ({ status: 'accepted' })),
      } as unknown as Model<any>,
      profile as unknown as Model<any>,
      profile as unknown as Model<any>,
    );
    return { service, update, profile, user: { id: 'user', role } };
  }

  it.each(['business', 'bookkeeper'])(
    'allows %s to cancel their own meeting',
    async (role) => {
      const { service, update, profile, user } = setup(role, true);
      await expect(
        service.changeMeetingStatus(id, 'cancelled', user),
      ).resolves.toEqual({ status: 'cancelled' });
      expect(profile.findOne).toHaveBeenCalledWith({ userId: 'user' });
      expect(update).toHaveBeenCalledWith(
        { _id: id, status: 'scheduled' },
        { $set: { status: 'cancelled', completedAt: null } },
        expect.any(Object),
      );
    },
  );

  it.each(['business', 'bookkeeper'])(
    'rejects %s changing another participant’s meeting',
    async (role) => {
      const { service, update, user } = setup(role, false);
      await expect(
        service.changeMeetingStatus(id, 'completed', user),
      ).rejects.toMatchObject({ status: 403 });
      expect(update).not.toHaveBeenCalled();
    },
  );

  it.each(['completed', 'cancelled'])(
    'rejects changing a %s meeting',
    async (status) => {
      const { service, update, user } = setup('business', true, status);
      await expect(
        service.changeMeetingStatus(id, 'completed', user),
      ).rejects.toMatchObject({ status: 409 });
      expect(update).not.toHaveBeenCalled();
    },
  );
});

import { Interview } from '@/models/interview.model';
import { HTTP_STATUS } from '@/constants';

export class DashboardError extends Error {
  public readonly statusCode: number;
  public readonly errors: string[];

  constructor(message: string, statusCode: number, errors: string[] = []) {
    super(message);
    this.name = 'DashboardError';
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

export async function getDashboardStats(recruiterId: string) {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [
    totalInterviews,
    upcomingInterviews,
    completedInterviews,
    cancelledInterviews,
    todaysInterviews,
  ] = await Promise.all([
    Interview.countDocuments({ createdBy: recruiterId }),
    Interview.countDocuments({ createdBy: recruiterId, status: 'Scheduled' }),
    Interview.countDocuments({ createdBy: recruiterId, status: 'Completed' }),
    Interview.countDocuments({ createdBy: recruiterId, status: 'Cancelled' }),
    Interview.countDocuments({
      createdBy: recruiterId,
      date: { $gte: startOfDay },
      status: { $ne: 'Cancelled' },
    }),
  ]);

  return {
    totalInterviews,
    upcomingInterviews,
    completedInterviews,
    cancelledInterviews,
    todaysInterviews,
  };
}

export async function getWeeklyAnalytics(recruiterId: string) {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() + mondayOffset);
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7);

  const interviews = await Interview.aggregate([
    {
      $match: {
        createdBy: recruiterId,
        date: { $gte: startOfWeek, $lt: endOfWeek },
      },
    },
    {
      $group: {
        _id: { $dayOfWeek: '$date' },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // MongoDB dayOfWeek: 1=Sunday, 2=Monday, ..., 7=Saturday
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const weekly: Record<string, number> = {};

  for (let i = 0; i < 7; i++) {
    weekly[dayNames[i]] = 0;
  }

  for (const entry of interviews) {
    const index = entry._id - 1; // Convert MongoDB 1-7 to 0-6
    weekly[dayNames[index]] = entry.count;
  }

  return weekly;
}

export async function getMonthlyAnalytics(recruiterId: string) {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const startOfNextYear = new Date(now.getFullYear() + 1, 0, 1);

  const interviews = await Interview.aggregate([
    {
      $match: {
        createdBy: recruiterId,
        date: { $gte: startOfYear, $lt: startOfNextYear },
      },
    },
    {
      $group: {
        _id: { $month: '$date' },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const monthly: Record<string, number> = {};
  for (let i = 0; i < 12; i++) {
    monthly[monthNames[i]] = 0;
  }

  for (const entry of interviews) {
    monthly[monthNames[entry._id - 1]] = entry.count;
  }

  return monthly;
}

export async function getRecentInterviews(recruiterId: string, limit = 5) {
  const interviews = await Interview.find({ createdBy: recruiterId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .select('title candidateName candidateEmail date time status createdAt')
    .lean();

  return interviews;
}

export async function getStatusCounts(recruiterId: string) {
  const counts = await Interview.aggregate([
    { $match: { createdBy: recruiterId } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  const statusMap: Record<string, number> = {
    Pending: 0,
    Scheduled: 0,
    InProgress: 0,
    Completed: 0,
    Cancelled: 0,
  };

  for (const entry of counts) {
    statusMap[entry._id] = entry.count;
  }

  return statusMap;
}

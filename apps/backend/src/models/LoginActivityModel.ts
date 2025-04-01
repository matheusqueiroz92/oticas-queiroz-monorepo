import { LoginActivity, ILoginActivity } from '../schemas/LoginActivitySchema';
import { FilterQuery, Types } from 'mongoose';

export class LoginActivityModel {
  private isValidId(id: string): boolean {
    return Types.ObjectId.isValid(id);
  }

  async create(activityData: Omit<ILoginActivity, '_id'>): Promise<ILoginActivity> {
    const activity = new LoginActivity(activityData);
    const savedActivity = await activity.save();
    return this.convertToILoginActivity(savedActivity);
  }

  async findByUserId(
    userId: string, 
    page = 1, 
    limit = 10
  ): Promise<{ activities: ILoginActivity[]; total: number }> {
    if (!this.isValidId(userId)) return { activities: [], total: 0 };

    const skip = (page - 1) * limit;
    const query: FilterQuery<any> = { userId: new Types.ObjectId(userId) };

    const [activities, total] = await Promise.all([
      LoginActivity.find(query)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      LoginActivity.countDocuments(query)
    ]);

    return {
      activities: activities.map(activity => this.convertToILoginActivity(activity)),
      total
    };
  }

  async findRecentByUserId(userId: string, limit = 5): Promise<ILoginActivity[]> {
    if (!this.isValidId(userId)) return [];

    const activities = await LoginActivity.find({ 
      userId: new Types.ObjectId(userId),
      successful: true 
    })
      .sort({ timestamp: -1 })
      .limit(limit)
      .exec();

    return activities.map(activity => this.convertToILoginActivity(activity));
  }

  private convertToILoginActivity(doc: any): ILoginActivity {
    const activity = doc.toObject ? doc.toObject() : doc;
    
    return {
      _id: activity._id.toString(),
      userId: activity.userId.toString(),
      timestamp: activity.timestamp,
      ipAddress: activity.ipAddress,
      userAgent: activity.userAgent,
      successful: activity.successful,
      location: activity.location,
      device: activity.device
    };
  }
}
import { Report } from "../schemas/ReportSchema";
import type { IReport, ReportFilters, ReportData } from "../interfaces/IReport";
import { type Document, Types, type FilterQuery } from "mongoose";

interface ReportDocument extends Document {
  _id: Types.ObjectId;
  name: string;
  type: "sales" | "inventory" | "customers" | "orders" | "financial";
  filters: ReportFilters;
  data: ReportData;
  createdBy: Types.ObjectId;
  format: "json" | "pdf" | "excel";
  status: "pending" | "processing" | "completed" | "error";
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class ReportModel {
  private isValidId(id: string): boolean {
    return Types.ObjectId.isValid(id);
  }

  async create(reportData: Omit<IReport, "_id">): Promise<IReport> {
    const report = new Report(reportData);
    const savedReport = (await report.save()) as ReportDocument;
    return this.convertToIReport(savedReport);
  }

  async findById(id: string): Promise<IReport | null> {
    if (!this.isValidId(id)) return null;

    const report = (await Report.findById(id)
      .populate("createdBy", "name email")
      .exec()) as ReportDocument | null;

    return report ? this.convertToIReport(report) : null;
  }

  async findByUser(
    userId: string,
    page = 1,
    limit = 10
  ): Promise<{ reports: IReport[]; total: number }> {
    if (!this.isValidId(userId)) return { reports: [], total: 0 };

    const skip = (page - 1) * limit;
    const query: FilterQuery<ReportDocument> = { createdBy: userId };

    const [reports, total] = await Promise.all([
      Report.find(query)
        .populate("createdBy", "name email")
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .exec() as Promise<ReportDocument[]>,
      Report.countDocuments(query),
    ]);

    return {
      reports: reports.map((report) => this.convertToIReport(report)),
      total,
    };
  }

  async updateStatus(
    id: string,
    status: IReport["status"],
    data?: ReportData,
    errorMessage?: string
  ): Promise<IReport | null> {
    if (!this.isValidId(id)) return null;

    type UpdateData = {
      status: IReport["status"];
      data?: ReportData;
      errorMessage?: string;
    };

    const updateData: UpdateData = { status };
    if (data !== undefined) updateData.data = data;
    if (errorMessage) updateData.errorMessage = errorMessage;

    const report = (await Report.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    ).populate("createdBy", "name email")) as ReportDocument | null;

    return report ? this.convertToIReport(report) : null;
  }

  private convertToIReport(doc: ReportDocument): IReport {
    const report = doc.toObject();
    return {
      ...report,
      _id: doc._id.toString(),
      createdBy:
        typeof doc.createdBy === "object" && doc.createdBy?._id
          ? doc.createdBy._id.toString()
          : doc.createdBy.toString(),
    };
  }
}

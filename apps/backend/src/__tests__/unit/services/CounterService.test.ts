import { CounterService } from "../../../services/CounterService";
import { RepositoryFactory } from "../../../repositories/RepositoryFactory";
import type { ICounterRepository } from "../../../repositories/interfaces/ICounterRepository";
import mongoose from "mongoose";
import { describe, it, expect, beforeEach, jest } from "@jest/globals";

// Mock do RepositoryFactory
jest.mock("../../../repositories/RepositoryFactory");

describe("CounterService", () => {
  let mockCounterRepository: jest.Mocked<ICounterRepository>;
  let mockRepositoryFactory: jest.Mocked<RepositoryFactory>;

  beforeEach(() => {
    // Setup do mock do repository
    mockCounterRepository = {
      getNextSequence: jest.fn(),
      getNextSequenceWithSession: jest.fn(),
      getCurrentSequence: jest.fn(),
      resetCounter: jest.fn(),
      createCounter: jest.fn(),
      exists: jest.fn(),
      findAll: jest.fn(),
      deleteCounter: jest.fn(),
    };

    mockRepositoryFactory = {
      getCounterRepository: jest.fn().mockReturnValue(mockCounterRepository),
    } as any;

    (RepositoryFactory.getInstance as jest.Mock).mockReturnValue(mockRepositoryFactory);
  });

  describe("getNextSequence", () => {
    it("should get next sequence with default start value", async () => {
      mockCounterRepository.getNextSequence.mockResolvedValue(300000);

      const result = await CounterService.getNextSequence("serviceOrder");

      expect(result).toBe(300000);
      expect(mockCounterRepository.getNextSequence).toHaveBeenCalledWith("serviceOrder", 300000);
    });

    it("should get next sequence with custom start value", async () => {
      mockCounterRepository.getNextSequence.mockResolvedValue(500000);

      const result = await CounterService.getNextSequence("customCounter", 500000);

      expect(result).toBe(500000);
      expect(mockCounterRepository.getNextSequence).toHaveBeenCalledWith("customCounter", 500000);
    });

    it("should increment sequence", async () => {
      mockCounterRepository.getNextSequence
        .mockResolvedValueOnce(300000)
        .mockResolvedValueOnce(300001);

      const firstResult = await CounterService.getNextSequence("serviceOrder");
      const secondResult = await CounterService.getNextSequence("serviceOrder");

      expect(firstResult).toBe(300000);
      expect(secondResult).toBe(300001);
      expect(mockCounterRepository.getNextSequence).toHaveBeenCalledTimes(2);
    });

    it("should handle different counter IDs", async () => {
      mockCounterRepository.getNextSequence
        .mockResolvedValueOnce(300000)
        .mockResolvedValueOnce(100000);

      const serviceOrderSeq = await CounterService.getNextSequence("serviceOrder");
      const invoiceSeq = await CounterService.getNextSequence("invoice", 100000);

      expect(serviceOrderSeq).toBe(300000);
      expect(invoiceSeq).toBe(100000);
      expect(mockCounterRepository.getNextSequence).toHaveBeenCalledWith("serviceOrder", 300000);
      expect(mockCounterRepository.getNextSequence).toHaveBeenCalledWith("invoice", 100000);
    });
  });

  describe("getNextSequenceWithSession", () => {
    it("should get next sequence with session", async () => {
      const mockSession = {} as mongoose.ClientSession;
      mockCounterRepository.getNextSequenceWithSession.mockResolvedValue(300000);

      const result = await CounterService.getNextSequenceWithSession("serviceOrder", mockSession);

      expect(result).toBe(300000);
      expect(mockCounterRepository.getNextSequenceWithSession).toHaveBeenCalledWith(
        "serviceOrder", 
        mockSession, 
        300000
      );
    });

    it("should get next sequence with session and custom start value", async () => {
      const mockSession = {} as mongoose.ClientSession;
      mockCounterRepository.getNextSequenceWithSession.mockResolvedValue(500000);

      const result = await CounterService.getNextSequenceWithSession("customCounter", mockSession, 500000);

      expect(result).toBe(500000);
      expect(mockCounterRepository.getNextSequenceWithSession).toHaveBeenCalledWith(
        "customCounter",
        mockSession,
        500000
      );
    });
  });

  describe("getCurrentSequence", () => {
    it("should return current sequence value", async () => {
      mockCounterRepository.getCurrentSequence.mockResolvedValue(300001);

      const result = await CounterService.getCurrentSequence("serviceOrder");

      expect(result).toBe(300001);
      expect(mockCounterRepository.getCurrentSequence).toHaveBeenCalledWith("serviceOrder");
    });

    it("should return null for non-existent counter", async () => {
      mockCounterRepository.getCurrentSequence.mockResolvedValue(null);

      const result = await CounterService.getCurrentSequence("nonexistent");

      expect(result).toBeNull();
      expect(mockCounterRepository.getCurrentSequence).toHaveBeenCalledWith("nonexistent");
    });
  });

  describe("resetCounter", () => {
    it("should reset counter to specific value", async () => {
      mockCounterRepository.resetCounter.mockResolvedValue(true);

      const result = await CounterService.resetCounter("serviceOrder", 400000);

      expect(result).toBe(true);
      expect(mockCounterRepository.resetCounter).toHaveBeenCalledWith("serviceOrder", 400000);
    });

    it("should return false if reset fails", async () => {
      mockCounterRepository.resetCounter.mockResolvedValue(false);

      const result = await CounterService.resetCounter("serviceOrder", 400000);

      expect(result).toBe(false);
      expect(mockCounterRepository.resetCounter).toHaveBeenCalledWith("serviceOrder", 400000);
    });
  });

  describe("createCounter", () => {
    it("should create counter with default initial value", async () => {
      const mockCounter = { _id: "serviceOrder", sequence: 300000 };
      mockCounterRepository.createCounter.mockResolvedValue(mockCounter);

      const result = await CounterService.createCounter("serviceOrder");

      expect(result).toEqual(mockCounter);
      expect(mockCounterRepository.createCounter).toHaveBeenCalledWith("serviceOrder", 300000);
    });

    it("should create counter with custom initial value", async () => {
      const mockCounter = { _id: "customCounter", sequence: 500000 };
      mockCounterRepository.createCounter.mockResolvedValue(mockCounter);

      const result = await CounterService.createCounter("customCounter", 500000);

      expect(result).toEqual(mockCounter);
      expect(mockCounterRepository.createCounter).toHaveBeenCalledWith("customCounter", 500000);
    });
  });

  describe("exists", () => {
    it("should return true if counter exists", async () => {
      mockCounterRepository.exists.mockResolvedValue(true);

      const result = await CounterService.exists("serviceOrder");

      expect(result).toBe(true);
      expect(mockCounterRepository.exists).toHaveBeenCalledWith("serviceOrder");
    });

    it("should return false if counter does not exist", async () => {
      mockCounterRepository.exists.mockResolvedValue(false);

      const result = await CounterService.exists("nonexistent");

      expect(result).toBe(false);
      expect(mockCounterRepository.exists).toHaveBeenCalledWith("nonexistent");
    });
  });

  describe("findAll", () => {
    it("should return all counters", async () => {
      const mockCounters = [
        { _id: "serviceOrder", sequence: 300001 },
        { _id: "invoice", sequence: 100002 },
      ];
      mockCounterRepository.findAll.mockResolvedValue(mockCounters);

      const result = await CounterService.findAll();

      expect(result).toEqual(mockCounters);
      expect(mockCounterRepository.findAll).toHaveBeenCalled();
    });

    it("should return empty array if no counters exist", async () => {
      mockCounterRepository.findAll.mockResolvedValue([]);

      const result = await CounterService.findAll();

      expect(result).toEqual([]);
      expect(mockCounterRepository.findAll).toHaveBeenCalled();
    });
  });

  describe("deleteCounter", () => {
    it("should delete counter successfully", async () => {
      mockCounterRepository.deleteCounter.mockResolvedValue(true);

      const result = await CounterService.deleteCounter("serviceOrder");

      expect(result).toBe(true);
      expect(mockCounterRepository.deleteCounter).toHaveBeenCalledWith("serviceOrder");
    });

    it("should return false if delete fails", async () => {
      mockCounterRepository.deleteCounter.mockResolvedValue(false);

      const result = await CounterService.deleteCounter("nonexistent");

      expect(result).toBe(false);
      expect(mockCounterRepository.deleteCounter).toHaveBeenCalledWith("nonexistent");
    });
  });

  describe("Instance methods", () => {
    let counterService: CounterService;

    beforeEach(() => {
      counterService = new CounterService();
    });

    it("should get next sequence using instance method", async () => {
      mockCounterRepository.getNextSequence.mockResolvedValue(300000);

      const result = await counterService.getNextSequenceInstance("serviceOrder", 300000);

      expect(result).toBe(300000);
      expect(mockCounterRepository.getNextSequence).toHaveBeenCalledWith("serviceOrder", 300000);
    });

    it("should get next sequence with session using instance method", async () => {
      const mockSession = {} as mongoose.ClientSession;
      mockCounterRepository.getNextSequenceWithSession.mockResolvedValue(300000);

      const result = await counterService.getNextSequenceWithSessionInstance(
        "serviceOrder", 
        mockSession, 
        300000
      );

      expect(result).toBe(300000);
      expect(mockCounterRepository.getNextSequenceWithSession).toHaveBeenCalledWith(
        "serviceOrder",
        mockSession,
        300000
      );
    });

    it("should get current sequence using instance method", async () => {
      mockCounterRepository.getCurrentSequence.mockResolvedValue(300001);

      const result = await counterService.getCurrentSequenceInstance("serviceOrder");

      expect(result).toBe(300001);
      expect(mockCounterRepository.getCurrentSequence).toHaveBeenCalledWith("serviceOrder");
    });
  });
}); 
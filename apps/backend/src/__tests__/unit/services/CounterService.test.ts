// import { CounterService } from '../../services/CounterService';
// import { Counter } from '../../schemas/CounterSchema';
// import mongoose from 'mongoose';
// import { MongoMemoryServer } from 'mongodb-memory-server';

// describe('CounterService', () => {
//   let mongoServer: MongoMemoryServer;

//   beforeAll(async () => {
//     mongoServer = await MongoMemoryServer.create();
//     const mongoUri = mongoServer.getUri();
//     await mongoose.connect(mongoUri);
//   });

//   afterAll(async () => {
//     await mongoose.disconnect();
//     await mongoServer.stop();
//   });

//   beforeEach(async () => {
//     await Counter.deleteMany({});
//   });

//   describe('getNextSequence', () => {
//     it('deve criar um novo contador começando em 300000', async () => {
//       const sequence = await CounterService.getNextSequence('serviceOrder');
//       expect(sequence).toBe(300000);
//     });

//     it('deve incrementar o contador existente', async () => {
//       // Primeiro chamada
//       const firstSequence = await CounterService.getNextSequence('serviceOrder');
//       expect(firstSequence).toBe(300000);

//       // Segunda chamada
//       const secondSequence = await CounterService.getNextSequence('serviceOrder');
//       expect(secondSequence).toBe(300001);

//       // Terceira chamada
//       const thirdSequence = await CounterService.getNextSequence('serviceOrder');
//       expect(thirdSequence).toBe(300002);
//     });

//     it('deve usar valor inicial personalizado', async () => {
//       const sequence = await CounterService.getNextSequence('customCounter', 500000);
//       expect(sequence).toBe(500000);
//     });

//     it('deve funcionar com múltiplos contadores diferentes', async () => {
//       const serviceOrderSeq = await CounterService.getNextSequence('serviceOrder');
//       const invoiceSeq = await CounterService.getNextSequence('invoice', 100000);

//       expect(serviceOrderSeq).toBe(300000);
//       expect(invoiceSeq).toBe(100000);

//       // Incrementar cada um novamente
//       const serviceOrderSeq2 = await CounterService.getNextSequence('serviceOrder');
//       const invoiceSeq2 = await CounterService.getNextSequence('invoice', 100000);

//       expect(serviceOrderSeq2).toBe(300001);
//       expect(invoiceSeq2).toBe(100001);
//     });
//   });

//   describe('getNextSequenceWithSession', () => {
//     it('deve funcionar com sessão de transação', async () => {
//       const session = await mongoose.startSession();
      
//       try {
//         session.startTransaction();
        
//         const sequence = await CounterService.getNextSequenceWithSession('serviceOrder', session);
//         expect(sequence).toBe(300000);
        
//         await session.commitTransaction();
//       } finally {
//         await session.endSession();
//       }
//     });
//   });

//   describe('getCurrentSequence', () => {
//     it('deve retornar null para contador inexistente', async () => {
//       const current = await CounterService.getCurrentSequence('nonexistent');
//       expect(current).toBeNull();
//     });

//     it('deve retornar o valor atual do contador', async () => {
//       // Criar contador
//       await CounterService.getNextSequence('serviceOrder');
//       await CounterService.getNextSequence('serviceOrder');

//       const current = await CounterService.getCurrentSequence('serviceOrder');
//       expect(current).toBe(300001);
//     });
//   });

//   describe('resetCounter', () => {
//     it('deve resetar contador para um valor específico', async () => {
//       // Criar contador
//       await CounterService.getNextSequence('serviceOrder');
      
//       // Resetar para 400000
//       const success = await CounterService.resetCounter('serviceOrder', 400000);
//       expect(success).toBe(true);

//       // Verificar se foi resetado
//       const current = await CounterService.getCurrentSequence('serviceOrder');
//       expect(current).toBe(400000);

//       // Próximo valor deve ser 400001
//       const next = await CounterService.getNextSequence('serviceOrder');
//       expect(next).toBe(400001);
//     });

//     it('deve criar novo contador se não existir', async () => {
//       const success = await CounterService.resetCounter('newCounter', 500000);
//       expect(success).toBe(true);

//       const current = await CounterService.getCurrentSequence('newCounter');
//       expect(current).toBe(500000);
//     });
//   });

//   describe('Concorrência', () => {
//     it('deve manter sequência correta com múltiplas chamadas simultâneas', async () => {
//       const promises = Array.from({ length: 10 }, () => 
//         CounterService.getNextSequence('serviceOrder')
//       );

//       const results = await Promise.all(promises);
      
//       // Verificar se todos os valores são únicos
//       const uniqueResults = new Set(results);
//       expect(uniqueResults.size).toBe(10);

//       // Verificar se estão na sequência correta
//       const sortedResults = results.sort((a, b) => a - b);
//       expect(sortedResults).toEqual([300000, 300001, 300002, 300003, 300004, 300005, 300006, 300007, 300008, 300009]);
//     });
//   });
// });
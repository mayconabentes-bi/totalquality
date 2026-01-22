/**
 * Data Cleanup Utilities - Left Anti-Join Pattern
 * 
 * Utilities for cleaning up obsolete data, orphaned records,
 * and maintaining data consistency across collections.
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin if not already initialized
function initializeFirebase() {
  if (admin.apps.length === 0) {
    admin.initializeApp();
  }
  return admin.firestore();
}

/**
 * Left Anti-Join: Find records in collection A that don't exist in collection B
 * Useful for identifying orphaned records and data inconsistencies
 */
async function leftAntiJoin(collectionA, collectionB, joinField, options = {}) {
  console.log(`\n🔍 Executando Left Anti-Join...`);
  console.log(`  Coleção A: ${collectionA}`);
  console.log(`  Coleção B: ${collectionB}`);
  console.log(`  Campo de junção: ${joinField}\n`);
  
  const db = initializeFirebase();
  const orphanedRecords = [];
  
  try {
    // Get all records from collection A
    let queryA = db.collection(collectionA);
    if (options.limitA) {
      queryA = queryA.limit(options.limitA);
    }
    
    const snapshotA = await queryA.get();
    console.log(`✓ Carregados ${snapshotA.size} registros de ${collectionA}`);
    
    // Get all unique values from collection B for the join field
    let queryB = db.collection(collectionB);
    if (options.limitB) {
      queryB = queryB.limit(options.limitB);
    }
    
    const snapshotB = await queryB.get();
    console.log(`✓ Carregados ${snapshotB.size} registros de ${collectionB}`);
    
    // Create a Set of all values in collection B
    const valuesInB = new Set();
    snapshotB.forEach(doc => {
      const data = doc.data();
      const value = data[joinField];
      if (value) {
        valuesInB.add(value);
      }
    });
    
    console.log(`✓ Identificados ${valuesInB.size} valores únicos em ${collectionB}.${joinField}`);
    
    // Find records in A that don't exist in B
    snapshotA.forEach(doc => {
      const data = doc.data();
      const value = data[joinField];
      
      if (!value || !valuesInB.has(value)) {
        orphanedRecords.push({
          id: doc.id,
          [joinField]: value || 'NULL',
          data: options.includeFullData ? data : undefined,
        });
      }
    });
    
    console.log(`\n📊 Resultado:`);
    console.log(`  Total de registros em ${collectionA}: ${snapshotA.size}`);
    console.log(`  Registros órfãos encontrados: ${orphanedRecords.length}`);
    
    return orphanedRecords;
    
  } catch (error) {
    console.error('❌ Erro durante Left Anti-Join:', error);
    throw error;
  }
}

/**
 * Clean up obsolete documents older than specified days
 */
async function cleanupObsoleteDocuments(daysOld = 365, dryRun = true) {
  console.log('\n🧹 Limpeza de Documentos Obsoletos...');
  console.log(`  Removendo documentos obsoletos há mais de ${daysOld} dias`);
  console.log(`  Modo: ${dryRun ? 'DRY RUN (simulação)' : 'EXECUÇÃO REAL'}\n`);
  
  const db = initializeFirebase();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  
  try {
    const documentsRef = db.collection('documents');
    const obsoleteQuery = documentsRef
      .where('status', '==', 'obsoleto')
      .where('metadata.ultimaRevisao', '<', admin.firestore.Timestamp.fromDate(cutoffDate));
    
    const snapshot = await obsoleteQuery.get();
    console.log(`✓ Encontrados ${snapshot.size} documentos obsoletos para remoção`);
    
    if (snapshot.size === 0) {
      console.log('✅ Nenhum documento obsoleto para remover.');
      return { removed: 0, failed: 0 };
    }
    
    const batch = db.batch();
    let batchCount = 0;
    let removed = 0;
    let failed = 0;
    
    for (const doc of snapshot.docs) {
      const data = doc.data();
      console.log(`  ${dryRun ? '🔍' : '🗑️'} ${doc.id} - ${data.titulo} (v${data.versao})`);
      
      if (!dryRun) {
        try {
          batch.delete(doc.ref);
          batchCount++;
          
          // Commit batch every 500 operations (Firestore limit)
          if (batchCount >= 500) {
            await batch.commit();
            removed += batchCount;
            batchCount = 0;
          }
        } catch (error) {
          console.error(`  ❌ Erro ao remover ${doc.id}:`, error.message);
          failed++;
        }
      } else {
        removed++;
      }
    }
    
    // Commit remaining operations
    if (!dryRun && batchCount > 0) {
      await batch.commit();
      removed += batchCount;
    }
    
    console.log(`\n📊 Resultado:`);
    console.log(`  Documentos removidos: ${removed}`);
    console.log(`  Falhas: ${failed}`);
    
    if (dryRun) {
      console.log('\n⚠️ Esta foi uma simulação. Execute com dryRun=false para remover realmente.');
    }
    
    return { removed, failed };
    
  } catch (error) {
    console.error('❌ Erro durante limpeza:', error);
    throw error;
  }
}

/**
 * Find and optionally remove orphaned video POPs without corresponding documents
 */
async function cleanupOrphanedVideoPOPs(dryRun = true) {
  console.log('\n🎥 Limpeza de POPs de Vídeo Órfãos...');
  console.log(`  Modo: ${dryRun ? 'DRY RUN (simulação)' : 'EXECUÇÃO REAL'}\n`);
  
  const db = initializeFirebase();
  
  try {
    // Get all companies
    const companiesSnapshot = await db.collection('companies').get();
    console.log(`✓ Verificando ${companiesSnapshot.size} empresas...`);
    
    let totalOrphaned = 0;
    let totalRemoved = 0;
    
    for (const companyDoc of companiesSnapshot.docs) {
      const companyId = companyDoc.id;
      console.log(`\n  Empresa: ${companyId}`);
      
      // Get all POPs for this company
      const popsSnapshot = await companyDoc.ref.collection('pops').get();
      console.log(`    POPs encontrados: ${popsSnapshot.size}`);
      
      if (popsSnapshot.size === 0) {
        continue;
      }
      
      // Get all documents for this company
      const documentsSnapshot = await db.collection('documents')
        .where('orgId', '==', companyId)
        .where('tipo', '==', 'POP')
        .get();
      
      const documentVideoIds = new Set();
      documentsSnapshot.forEach(doc => {
        const data = doc.data();
        if (data.videoId) {
          documentVideoIds.add(data.videoId);
        }
      });
      
      console.log(`    Documentos POP vinculados: ${documentVideoIds.size}`);
      
      // Find orphaned POPs
      const orphanedPOPs = [];
      popsSnapshot.forEach(popDoc => {
        const popId = popDoc.id;
        if (!documentVideoIds.has(popId)) {
          orphanedPOPs.push(popDoc);
        }
      });
      
      if (orphanedPOPs.length > 0) {
        console.log(`    ⚠️ POPs órfãos: ${orphanedPOPs.length}`);
        totalOrphaned += orphanedPOPs.length;
        
        for (const popDoc of orphanedPOPs) {
          const popData = popDoc.data();
          console.log(`      ${dryRun ? '🔍' : '🗑️'} ${popDoc.id} - ${popData.videoPath || 'sem path'}`);
          
          if (!dryRun) {
            await popDoc.ref.delete();
            totalRemoved++;
          }
        }
      } else {
        console.log(`    ✓ Nenhum POP órfão`);
      }
    }
    
    console.log(`\n📊 Resultado Total:`);
    console.log(`  POPs órfãos encontrados: ${totalOrphaned}`);
    if (!dryRun) {
      console.log(`  POPs removidos: ${totalRemoved}`);
    }
    
    if (dryRun && totalOrphaned > 0) {
      console.log('\n⚠️ Esta foi uma simulação. Execute com dryRun=false para remover realmente.');
    }
    
    return { orphaned: totalOrphaned, removed: totalRemoved };
    
  } catch (error) {
    console.error('❌ Erro durante limpeza:', error);
    throw error;
  }
}

/**
 * Main CLI handler for data cleanup
 */
async function main() {
  const command = process.argv[2];
  
  if (!command) {
    console.log('TotalQuality - Data Cleanup Utilities\n');
    console.log('Uso: node cli/dataCleanup.js <comando> [opções]\n');
    console.log('Comandos disponíveis:');
    console.log('  cleanup-obsolete [days] [execute]  - Remover documentos obsoletos');
    console.log('                                       days: dias de antiguidade (padrão: 365)');
    console.log('                                       execute: adicione para executar (padrão: dry-run)');
    console.log('  cleanup-pops [execute]             - Remover POPs de vídeo órfãos');
    console.log('                                       execute: adicione para executar (padrão: dry-run)');
    console.log('  left-anti-join <colA> <colB> <field>  - Executar Left Anti-Join\n');
    console.log('Exemplos:');
    console.log('  node cli/dataCleanup.js cleanup-obsolete 180 execute');
    console.log('  node cli/dataCleanup.js cleanup-pops execute');
    console.log('  node cli/dataCleanup.js left-anti-join documents companies orgId\n');
    process.exit(1);
  }
  
  try {
    switch (command) {
      case 'cleanup-obsolete': {
        const daysOld = parseInt(process.argv[3]) || 365;
        const dryRun = process.argv[4] !== 'execute';
        await cleanupObsoleteDocuments(daysOld, dryRun);
        break;
      }
      
      case 'cleanup-pops': {
        const dryRun = process.argv[3] !== 'execute';
        await cleanupOrphanedVideoPOPs(dryRun);
        break;
      }
      
      case 'left-anti-join': {
        const collectionA = process.argv[3];
        const collectionB = process.argv[4];
        const joinField = process.argv[5];
        
        if (!collectionA || !collectionB || !joinField) {
          console.error('❌ Parâmetros insuficientes para left-anti-join');
          console.log('Uso: left-anti-join <collectionA> <collectionB> <joinField>');
          process.exit(1);
        }
        
        const orphanedRecords = await leftAntiJoin(collectionA, collectionB, joinField);
        
        if (orphanedRecords.length > 0) {
          console.log('\n📋 Registros Órfãos:');
          orphanedRecords.slice(0, 10).forEach((record, index) => {
            console.log(`  ${index + 1}. ID: ${record.id}`);
          });
          if (orphanedRecords.length > 10) {
            console.log(`  ... e mais ${orphanedRecords.length - 10} registros`);
          }
        }
        break;
      }
      
      default:
        console.error(`❌ Comando desconhecido: ${command}`);
        console.log('Execute sem argumentos para ver a lista de comandos disponíveis.');
        process.exit(1);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Erro fatal:', error.message);
    process.exit(1);
  }
}

// Execute if called directly
if (require.main === module) {
  main();
}

module.exports = {
  leftAntiJoin,
  cleanupObsoleteDocuments,
  cleanupOrphanedVideoPOPs,
};

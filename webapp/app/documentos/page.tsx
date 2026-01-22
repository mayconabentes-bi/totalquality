/**
 * Página de Demonstração - Gestão de Documentos
 * 
 * Demonstra o componente DocumentCard com dados de exemplo
 * representando diferentes tipos de documentos SGQ
 */

'use client';

import React from 'react';
import DocumentCard from '@/components/DocumentCard';
import { Document } from '@/types/document';

export default function DocumentosPage() {
  // Dados de exemplo para demonstração
  const documentosExemplo: Document[] = [
    {
      docId: '550e8400-e29b-41d4-a716-446655440001',
      orgId: 'org-001',
      tipo: 'POP',
      titulo: 'Procedimento de Higienização de Equipamentos',
      status: 'ativo',
      versao: '2.1',
      contentHash: 'abc123def456',
      metadata: {
        criadoPor: 'João Silva',
        dataCriacao: { seconds: 1705881600, nanoseconds: 0 },
        ultimaRevisao: { seconds: 1706486400, nanoseconds: 0 },
      },
      axiomaMetrics: {
        custoManutencao: 1250.00,
        impactoMargem: 'alto',
      },
    },
    {
      docId: '550e8400-e29b-41d4-a716-446655440002',
      orgId: 'org-001',
      tipo: 'Manual',
      titulo: 'Manual de Operação de Linha de Produção',
      status: 'revisao',
      versao: '1.5',
      contentHash: 'xyz789ghi012',
      metadata: {
        criadoPor: 'Maria Santos',
        dataCriacao: { seconds: 1704672000, nanoseconds: 0 },
        ultimaRevisao: { seconds: 1706400000, nanoseconds: 0 },
      },
      axiomaMetrics: {
        custoManutencao: 2500.00,
        impactoMargem: 'médio',
      },
    },
    {
      docId: '550e8400-e29b-41d4-a716-446655440003',
      orgId: 'org-001',
      tipo: 'Checklist',
      titulo: 'Checklist de Inspeção Diária de Qualidade',
      status: 'ativo',
      versao: '3.0',
      contentHash: 'mno345pqr678',
      metadata: {
        criadoPor: 'Carlos Oliveira',
        dataCriacao: { seconds: 1703462400, nanoseconds: 0 },
        ultimaRevisao: { seconds: 1706313600, nanoseconds: 0 },
      },
      axiomaMetrics: {
        custoManutencao: 450.00,
        impactoMargem: 'baixo',
      },
    },
    {
      docId: '550e8400-e29b-41d4-a716-446655440004',
      orgId: 'org-001',
      tipo: 'Política',
      titulo: 'Política de Gestão da Qualidade',
      status: 'obsoleto',
      versao: '1.0',
      contentHash: 'stu901vwx234',
      metadata: {
        criadoPor: 'Ana Costa',
        dataCriacao: { seconds: 1672531200, nanoseconds: 0 },
        ultimaRevisao: { seconds: 1680307200, nanoseconds: 0 },
      },
      axiomaMetrics: {
        custoManutencao: 800.00,
        impactoMargem: 'médio',
      },
    },
    {
      docId: '550e8400-e29b-41d4-a716-446655440005',
      orgId: 'org-001',
      tipo: 'POP',
      titulo: 'Procedimento de Calibração de Instrumentos',
      status: 'rascunho',
      versao: '0.3',
      contentHash: 'jkl567mno890',
      metadata: {
        criadoPor: 'Pedro Alves',
        dataCriacao: { seconds: 1706227200, nanoseconds: 0 },
        ultimaRevisao: { seconds: 1706400000, nanoseconds: 0 },
      },
      axiomaMetrics: {
        custoManutencao: 950.00,
        impactoMargem: 'alto',
      },
    },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-5xl font-bold text-gray-800 mb-4">
            🏆 TotalQuality
          </h1>
          <h2 className="text-2xl text-gray-600 mb-2">
            Módulo de Gestão de Documentação
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto">
            Sistema de Gestão de Qualidade (SGQ) baseado nos 4 Cs: 
            <span className="font-semibold"> Conformidade, Claridade, Cultura e Conexão</span>
          </p>
          <div className="mt-4 inline-flex items-center gap-3 bg-white px-6 py-3 rounded-full shadow-md">
            <span className="text-sm font-semibold text-gray-600">Sistema Axioma:</span>
            <span className="text-sm text-purple-600 font-bold">Inteligência de Margem Ativada</span>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-3xl font-bold text-green-600">
              {documentosExemplo.filter(d => d.status === 'ativo').length}
            </div>
            <div className="text-sm text-gray-600 mt-2">Documentos Ativos</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-3xl font-bold text-yellow-600">
              {documentosExemplo.filter(d => d.status === 'revisao').length}
            </div>
            <div className="text-sm text-gray-600 mt-2">Em Revisão</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-3xl font-bold text-gray-600">
              {documentosExemplo.filter(d => d.status === 'rascunho').length}
            </div>
            <div className="text-sm text-gray-600 mt-2">Rascunhos</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-3xl font-bold text-red-600">
              {documentosExemplo.filter(d => d.status === 'obsoleto').length}
            </div>
            <div className="text-sm text-gray-600 mt-2">Obsoletos</div>
          </div>
        </div>

        {/* Grid de Documentos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {documentosExemplo.map((doc) => (
            <DocumentCard
              key={doc.docId}
              document={doc}
              onClick={() => {
                console.log('Documento clicado:', doc.docId);
                alert(`Abrindo documento: ${doc.titulo}`);
              }}
            />
          ))}
        </div>

        {/* Footer com informações técnicas */}
        <div className="mt-12 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">
            ℹ️ Informações Técnicas
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <strong>Stack Tecnológica:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Backend: Firebase (Firestore, Auth, Storage)</li>
                <li>Frontend: React/Next.js com TypeScript</li>
                <li>UI: Tailwind CSS</li>
                <li>Lógica: Serverless com Cloud Functions</li>
              </ul>
            </div>
            <div>
              <strong>Características:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Multi-tenant com isolamento total por organização</li>
                <li>Versionamento automático de documentos</li>
                <li>Sistema Axioma de inteligência de margem</li>
                <li>Conformidade com normas SGQ</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

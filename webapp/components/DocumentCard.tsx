/**
 * DocumentCard - Componente de Exibição de Documento
 * 
 * Exibe um resumo visual de um documento do SGQ com:
 * - Status colorido (ativo, rascunho, revisão, obsoleto)
 * - Indicadores do Sistema Axioma (impacto na margem)
 * - Metadados e versão
 * 
 * Utiliza Tailwind CSS para estilização responsiva
 */

import React from 'react';
import { Document, DocumentStatus, ImpactoMargem } from '../types/document';

interface DocumentCardProps {
  document: Document;
  onClick?: () => void;
}

/**
 * Retorna as classes CSS para o status do documento
 */
const getStatusStyles = (status: DocumentStatus): string => {
  const statusStyles: Record<DocumentStatus, string> = {
    ativo: 'bg-green-100 border-green-500 text-green-800',
    rascunho: 'bg-gray-100 border-gray-400 text-gray-700',
    revisao: 'bg-yellow-100 border-yellow-500 text-yellow-800',
    obsoleto: 'bg-red-100 border-red-500 text-red-700',
  };
  return statusStyles[status];
};

/**
 * Retorna as classes CSS e ícone para o impacto na margem (Axioma)
 */
const getImpactoStyles = (impacto: ImpactoMargem): { style: string; icon: string; label: string } => {
  const impactoConfig: Record<ImpactoMargem, { style: string; icon: string; label: string }> = {
    alto: {
      style: 'bg-red-500 text-white',
      icon: '⬆️',
      label: 'Alto Impacto',
    },
    medio: {
      style: 'bg-orange-500 text-white',
      icon: '➡️',
      label: 'Médio Impacto',
    },
    baixo: {
      style: 'bg-blue-500 text-white',
      icon: '⬇️',
      label: 'Baixo Impacto',
    },
  };
  return impactoConfig[impacto];
};

/**
 * Retorna o label traduzido do tipo de documento
 */
const getTipoLabel = (tipo: string): string => {
  const labels: Record<string, string> = {
    POP: 'Procedimento Operacional Padrão',
    Manual: 'Manual',
    Checklist: 'Lista de Verificação',
    Politica: 'Política',
  };
  return labels[tipo] || tipo;
};

/**
 * Retorna o label traduzido do status
 */
const getStatusLabel = (status: DocumentStatus): string => {
  const labels: Record<DocumentStatus, string> = {
    ativo: 'Ativo',
    rascunho: 'Rascunho',
    revisao: 'Em Revisão',
    obsoleto: 'Obsoleto',
  };
  return labels[status];
};

/**
 * Formata data Firestore para exibição
 */
const formatDate = (date: Date | { seconds: number; nanoseconds: number }): string => {
  if (date instanceof Date) {
    return date.toLocaleDateString('pt-BR');
  }
  const timestamp = new Date(date.seconds * 1000);
  return timestamp.toLocaleDateString('pt-BR');
};

export const DocumentCard: React.FC<DocumentCardProps> = ({ document, onClick }) => {
  const statusStyles = getStatusStyles(document.status);
  const impactoConfig = getImpactoStyles(document.axiomaMetrics.impactoMargem);

  return (
    <div
      className={`
        relative rounded-lg shadow-lg border-l-4 p-6 transition-all duration-300 
        hover:shadow-xl hover:scale-105 cursor-pointer
        ${statusStyles}
      `}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyPress={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onClick?.();
        }
      }}
    >
      {/* Header com Tipo e Status */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <span className="text-xs font-semibold uppercase tracking-wide opacity-75">
            {getTipoLabel(document.tipo)}
          </span>
          <h3 className="text-xl font-bold mt-1 mb-2">{document.titulo}</h3>
        </div>
        <div className="flex flex-col items-end gap-2">
          {/* Badge de Status */}
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-white bg-opacity-50">
            {getStatusLabel(document.status)}
          </span>
          {/* Badge de Versão */}
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-white bg-opacity-30">
            v{document.versao}
          </span>
        </div>
      </div>

      {/* Informações de Metadados */}
      <div className="mb-4 text-sm opacity-90">
        <div className="flex items-center gap-2">
          <span className="font-semibold">Criado por:</span>
          <span>{document.metadata.criadoPor}</span>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className="font-semibold">Última revisão:</span>
          <span>{formatDate(document.metadata.ultimaRevisao)}</span>
        </div>
      </div>

      {/* Sistema Axioma - Indicadores de Margem */}
      <div className="mt-4 pt-4 border-t border-current border-opacity-20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide opacity-75 mb-1">
              Sistema Axioma
            </p>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${impactoConfig.style}`}>
                {impactoConfig.icon} {impactoConfig.label}
              </span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold uppercase tracking-wide opacity-75 mb-1">
              Custo Manutenção
            </p>
            <p className="text-lg font-bold">
              R$ {document.axiomaMetrics.custoManutencao.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Indicador de Obsoleto (se aplicável) */}
      {document.status === 'obsoleto' && (
        <div className="absolute top-2 right-2">
          <div className="bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold animate-pulse">
            ⚠️ OBSOLETO
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentCard;

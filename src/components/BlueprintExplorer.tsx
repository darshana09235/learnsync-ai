import React, { useState } from 'react';
import { 
  FileText, Network, Database, Server, Cpu, Palette, Users, Workflow, 
  HelpCircle, Rocket, Copy, Check, Code2 
} from 'lucide-react';
import { BLUEPRINT_MODULES } from '../data/blueprintData';

export const BlueprintExplorer: React.FC = () => {
  const [activeModuleId, setActiveModuleId] = useState<number>(1);
  const [copiedCodeIndex, setCopiedCodeIndex] = useState<number | null>(null);

  const activeModule = BLUEPRINT_MODULES.find((m) => m.id === activeModuleId) || BLUEPRINT_MODULES[0];

  const handleCopyCode = (code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeIndex(index);
    setTimeout(() => setCopiedCodeIndex(null), 2000);
  };

  const getModuleIcon = (name: string) => {
    switch (name) {
      case 'FileText': return <FileText className="w-4 h-4" />;
      case 'Network': return <Network className="w-4 h-4" />;
      case 'Database': return <Database className="w-4 h-4" />;
      case 'Server': return <Server className="w-4 h-4" />;
      case 'Cpu': return <Cpu className="w-4 h-4" />;
      case 'Palette': return <Palette className="w-4 h-4" />;
      case 'Users': return <Users className="w-4 h-4" />;
      case 'Workflow': return <Workflow className="w-4 h-4" />;
      case 'HelpCircle': return <HelpCircle className="w-4 h-4" />;
      case 'Rocket': return <Rocket className="w-4 h-4" />;
      default: return <Code2 className="w-4 h-4" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 font-sans" id="blueprint-explorer-root">
      
      {/* Top Banner Header */}
      <div className="bg-white border border-[#E7E9F0] rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#4F46E5] uppercase tracking-wider block">
              ARCHITECTURE & CAPSTONE BLUEPRINT
            </span>
            <span className="px-2 py-0.5 rounded-full bg-[#EEF0FE] text-[#4F46E5] text-[11px] font-semibold">
              10 Complete Modules
            </span>
          </div>
          <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight mt-0.5">
            CTO Architecture Matrix
          </h1>
          <p className="text-sm text-[#64748B]">
            System Requirements Specifications (SRS), Mermaid sequence diagrams, OpenAPI 3.0 contracts, Spring Boot Java templates, and Viva Q&A prep.
          </p>
        </div>
      </div>

      {/* Main Grid: Sidebar Navigation & Content Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Module Nav List */}
        <div className="lg:col-span-4 space-y-2">
          {BLUEPRINT_MODULES.map((mod) => {
            const isActive = mod.id === activeModuleId;
            return (
              <button
                key={mod.id}
                onClick={() => setActiveModuleId(mod.id)}
                className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-start gap-3 ${
                  isActive
                    ? 'bg-[#EEF0FE] border-[#4F46E5]/40 text-[#4F46E5] shadow-xs'
                    : 'bg-white border-[#E7E9F0] text-[#0F172A] hover:bg-[#F8FAFC]'
                }`}
              >
                <div className={`p-2 rounded-lg ${isActive ? 'bg-[#4F46E5] text-white' : 'bg-[#F8FAFC] text-[#64748B]'}`}>
                  {getModuleIcon(mod.iconName)}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wider opacity-80">
                    Module {mod.id}
                  </p>
                  <p className="text-sm font-bold truncate mt-0.5">{mod.title}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Content Viewer Panel */}
        <div className="lg:col-span-8 bg-white border border-[#E7E9F0] rounded-2xl p-6 space-y-6 shadow-sm">
          <div>
            <span className="text-xs font-semibold text-[#4F46E5] uppercase tracking-wider block">
              Module {activeModule.id} Details
            </span>
            <h2 className="text-xl font-bold text-[#0F172A] mt-0.5">{activeModule.title}</h2>
            <p className="text-sm text-[#64748B] mt-1">{activeModule.description}</p>
          </div>

          {/* Sections / Code Blocks */}
          <div className="space-y-4">
            {activeModule.sections.map((sec, idx) => (
              <div key={idx} className="bg-[#F8FAFC] border border-[#E7E9F0] rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[#0F172A]">{sec.heading}</h3>
                  {sec.codeBlock?.code && (
                    <button
                      onClick={() => handleCopyCode(sec.codeBlock?.code || '', idx)}
                      className="px-2.5 py-1 rounded bg-white hover:bg-[#EEF0FE] text-[#4F46E5] border border-[#E7E9F0] text-xs font-semibold transition-colors flex items-center gap-1"
                    >
                      {copiedCodeIndex === idx ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-[#059669]" />
                          <span className="text-[#059669]">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                <div className="text-xs text-[#64748B] leading-relaxed whitespace-pre-line">{sec.content}</div>

                {sec.codeBlock?.code && (
                  <div className="bg-[#0F172A] text-emerald-400 p-4 rounded-xl font-mono text-xs overflow-x-auto max-h-64">
                    <pre>{sec.codeBlock.code}</pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};

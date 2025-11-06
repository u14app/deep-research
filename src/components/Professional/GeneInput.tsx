'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTranslation } from 'react-i18next';

const geneResearchSchema = z.object({
  geneSymbol: z.string().min(1, 'Gene symbol is required'),
  organism: z.string().min(1, 'Organism is required'),
  researchFocus: z.array(z.string()).min(1, 'Select at least one focus'),
  specificAspects: z.array(z.string()).optional(),
  diseaseContext: z.string().optional(),
  experimentalApproach: z.string().optional(),
  researchQuestion: z.string().optional(),
});

type GeneResearchForm = z.infer<typeof geneResearchSchema>;

const organismOptions = [
  { value: 'Homo sapiens', label: 'Homo sapiens (Human)' },
  { value: 'Mus musculus', label: 'Mus musculus (Mouse)' },
  { value: 'Rattus norvegicus', label: 'Rattus norvegicus (Rat)' },
  { value: 'Danio rerio', label: 'Danio rerio (Zebrafish)' },
  { value: 'Drosophila melanogaster', label: 'Drosophila melanogaster (Fruit fly)' },
  { value: 'Caenorhabditis elegans', label: 'Caenorhabditis elegans (C. elegans)' },
  { value: 'Saccharomyces cerevisiae', label: 'Saccharomyces cerevisiae (Yeast)' },
  { value: 'Escherichia coli', label: 'Escherichia coli (E. coli)' },
  { value: 'Arabidopsis thaliana', label: 'Arabidopsis thaliana (Thale cress)' },
];

const researchFocusOptions = [
  { id: 'general', label: 'General Function' },
  { id: 'disease', label: 'Disease Association' },
  { id: 'structure', label: 'Protein Structure' },
  { id: 'expression', label: 'Expression Analysis' },
  { id: 'interactions', label: 'Protein Interactions' },
  { id: 'evolution', label: 'Evolutionary Analysis' },
  { id: 'therapeutic', label: 'Therapeutic Potential' },
];

const specificAspectsOptions = [
  { id: 'mutations', label: 'Mutations' },
  { id: 'protein_interactions', label: 'Protein Interactions' },
  { id: 'biological_pathways', label: 'Biological Pathways' },
  { id: 'evolution', label: 'Evolution' },
  { id: 'gene_regulation', label: 'Gene Regulation' },
  { id: 'expression_patterns', label: 'Expression Patterns' },
  { id: 'protein_structure', label: 'Protein Structure' },
  { id: 'molecular_function', label: 'Molecular Function' },
];

interface GeneInputProps {
  onSubmit: (data: GeneResearchForm) => void;
  isLoading?: boolean;
}

export function GeneInput({ onSubmit, isLoading }: GeneInputProps) {
  const { t } = useTranslation();
  const form = useForm<GeneResearchForm>({
    resolver: zodResolver(geneResearchSchema),
    defaultValues: {
      geneSymbol: '',
      organism: 'Homo sapiens',
      researchFocus: ['general'],
      specificAspects: [],
      diseaseContext: '',
      experimentalApproach: '',
      researchQuestion: '',
    },
  });

  const [selectedFocus, setSelectedFocus] = useState<string[]>(['general']);
  const [selectedAspects, setSelectedAspects] = useState<string[]>([]);

  const toggleFocus = (focusId: string) => {
    const newFocus = selectedFocus.includes(focusId)
      ? selectedFocus.filter(id => id !== focusId)
      : [...selectedFocus, focusId];

    setSelectedFocus(newFocus);
    form.setValue('researchFocus', newFocus);
  };

  const toggleAspect = (aspectId: string) => {
    const newAspects = selectedAspects.includes(aspectId)
      ? selectedAspects.filter(id => id !== aspectId)
      : [...selectedAspects, aspectId];

    setSelectedAspects(newAspects);
    form.setValue('specificAspects', newAspects);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Gene Symbol */}
        <FormField
          control={form.control}
          name="geneSymbol"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('geneResearch.geneSymbol', 'Gene Symbol')}</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., TP53, BRCA1, lysC"
                  {...field}
                  disabled={isLoading}
                />
              </FormControl>
              <FormDescription>
                {t('geneResearch.geneSymbolDesc', 'Enter the standard gene symbol or name')}
              </FormDescription>
            </FormItem>
          )}
        />

        {/* Organism */}
        <FormField
          control={form.control}
          name="organism"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('geneResearch.organism', 'Organism')}</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={isLoading}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t('geneResearch.selectOrganism', 'Select an organism')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {organismOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                {t('geneResearch.organismDesc', 'Select the organism for your gene research')}
              </FormDescription>
            </FormItem>
          )}
        />

        {/* Research Focus */}
        <div className="space-y-3">
          <FormLabel>{t('geneResearch.researchFocus', 'Research Focus')}</FormLabel>
          <div className="grid grid-cols-2 gap-3">
            {researchFocusOptions.map((option) => (
              <div
                key={option.id}
                className={`flex items-center space-x-2 p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedFocus.includes(option.id)
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => !isLoading && toggleFocus(option.id)}
              >
                <input
                  type="checkbox"
                  checked={selectedFocus.includes(option.id)}
                  onChange={() => toggleFocus(option.id)}
                  disabled={isLoading}
                  className="rounded"
                />
                <label className="cursor-pointer text-sm">
                  {t(`geneResearch.focus.${option.id}`, option.label)}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Specific Aspects (Optional) */}
        <div className="space-y-3">
          <FormLabel>
            {t('geneResearch.specificAspects', 'Specific Aspects')} ({t('common.optional', 'Optional')})
          </FormLabel>
          <FormDescription>
            {t('geneResearch.specificAspectsDesc', 'Select specific aspects you want to focus on')}
          </FormDescription>
          <div className="grid grid-cols-2 gap-3">
            {specificAspectsOptions.map((option) => (
              <div
                key={option.id}
                className={`flex items-center space-x-2 p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedAspects.includes(option.id)
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => !isLoading && toggleAspect(option.id)}
              >
                <input
                  type="checkbox"
                  checked={selectedAspects.includes(option.id)}
                  onChange={() => toggleAspect(option.id)}
                  disabled={isLoading}
                  className="rounded"
                />
                <label className="cursor-pointer text-sm">
                  {t(`geneResearch.aspects.${option.id}`, option.label)}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Disease Context (Optional) */}
        <FormField
          control={form.control}
          name="diseaseContext"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {t('geneResearch.diseaseContext', 'Disease Context')} ({t('common.optional', 'Optional')})
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., breast cancer, Alzheimer's disease"
                  {...field}
                  disabled={isLoading}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Experimental Approach (Optional) */}
        <FormField
          control={form.control}
          name="experimentalApproach"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {t('geneResearch.experimentalApproach', 'Experimental Approach')} ({t('common.optional', 'Optional')})
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., CRISPR, RNA-seq, ChIP-seq"
                  {...field}
                  disabled={isLoading}
                />
              </FormControl>
              <FormDescription>
                {t('geneResearch.experimentalApproachDesc', 'Specify the experimental approach if applicable')}
              </FormDescription>
            </FormItem>
          )}
        />

        {/* Research Question (Optional) */}
        <FormField
          control={form.control}
          name="researchQuestion"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {t('geneResearch.researchQuestion', 'Research Question')} ({t('common.optional', 'Optional')})
              </FormLabel>
              <FormControl>
                <Textarea
                  rows={4}
                  placeholder={t('geneResearch.researchQuestionPlaceholder', 'What is the function, structure, and biological role of the gene {geneSymbol} in {organism}?')}
                  {...field}
                  disabled={isLoading}
                />
              </FormControl>
              <FormDescription>
                {t('geneResearch.researchQuestionDesc', 'Define your specific research question. Use {geneSymbol} and {organism} as placeholders.')}
              </FormDescription>
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isLoading} className="w-full" size="lg">
          {isLoading
            ? t('geneResearch.researching', 'Researching...')
            : `🧬 ${t('geneResearch.startResearch', 'Start Gene Research')}`}
        </Button>
      </form>
    </Form>
  );
}

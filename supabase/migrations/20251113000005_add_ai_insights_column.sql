-- Migration: Add ai_insights column to leads table for persistent storage
-- Created: 2025-11-13
-- Description: Store AI insights (enrichment data) directly in leads table

-- Add ai_insights column to leads table
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS ai_insights JSONB DEFAULT NULL;

-- Add index for JSONB queries
CREATE INDEX IF NOT EXISTS idx_leads_ai_insights ON public.leads USING GIN (ai_insights);

-- Add comment
COMMENT ON COLUMN public.leads.ai_insights IS 'AI-generated insights from enrich-lead function: conversion likelihood, engagement level, messaging strategy, best send time';

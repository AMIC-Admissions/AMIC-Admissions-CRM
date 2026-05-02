/**
 * Report Templates Management
 * Handles saving, loading, and managing report templates
 */

import { getDb } from "./db";
import { reportTemplates } from "../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import { ReportFilter, ReportFieldOption } from "../shared/reportTypes";
import { TRPCError } from "@trpc/server";

export interface SavedTemplate {
  id: number;
  name: string;
  description?: string;
  filters: ReportFilter;
  selectedFields: ReportFieldOption[];
  createdAt: Date;
}

/**
 * Save a report template
 */
export async function saveReportTemplate(
  userId: number,
  name: string,
  description: string | undefined,
  filters: ReportFilter,
  selectedFields: ReportFieldOption[]
): Promise<SavedTemplate> {
  const db = await getDb();
  if (!db) {
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
  }

  try {
    // Check if template with same name already exists for this user
    const existing = await db
      .select()
      .from(reportTemplates)
      .where(and(eq(reportTemplates.name, name), eq(reportTemplates.createdBy, userId)))
      .limit(1);

    if (existing.length > 0) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "Template with this name already exists",
      });
    }

    await db.insert(reportTemplates).values({
      name,
      description,
      filters: JSON.stringify(filters),
      selectedFields: JSON.stringify(selectedFields),
      createdBy: userId,
    });

    // Get the inserted template
    const inserted = await db
      .select()
      .from(reportTemplates)
      .where(and(eq(reportTemplates.name, name), eq(reportTemplates.createdBy, userId)))
      .orderBy(desc(reportTemplates.createdAt))
      .limit(1);

    const template = inserted[0];
    return {
      id: template.id,
      name: template.name,
      description: template.description || undefined,
      filters: JSON.parse(template.filters),
      selectedFields: JSON.parse(template.selectedFields),
      createdAt: template.createdAt,
    };
  } catch (error) {
    if (error instanceof TRPCError) throw error;
    console.error("[ReportTemplates] Error saving template:", error);
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to save template",
    });
  }
}

/**
 * Get all templates for a user
 */
export async function getUserTemplates(userId: number): Promise<SavedTemplate[]> {
  const db = await getDb();
  if (!db) {
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
  }

  try {
    const templates = await db
      .select()
      .from(reportTemplates)
      .where(eq(reportTemplates.createdBy, userId))
      .orderBy(desc(reportTemplates.createdAt));

    return templates.map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description || undefined,
      filters: JSON.parse(t.filters),
      selectedFields: JSON.parse(t.selectedFields),
      createdAt: t.createdAt,
    }));
  } catch (error) {
    console.error("[ReportTemplates] Error fetching templates:", error);
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to fetch templates",
    });
  }
}

/**
 * Get a specific template
 */
export async function getTemplate(userId: number, templateId: number): Promise<SavedTemplate> {
  const db = await getDb();
  if (!db) {
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
  }

  try {
    const template = await db
      .select()
      .from(reportTemplates)
      .where(and(eq(reportTemplates.id, templateId), eq(reportTemplates.createdBy, userId)))
      .limit(1);

    if (template.length === 0) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Template not found" });
    }

    const t = template[0];
    return {
      id: t.id,
      name: t.name,
      description: t.description || undefined,
      filters: JSON.parse(t.filters),
      selectedFields: JSON.parse(t.selectedFields),
      createdAt: t.createdAt,
    };
  } catch (error) {
    if (error instanceof TRPCError) throw error;
    console.error("[ReportTemplates] Error fetching template:", error);
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to fetch template",
    });
  }
}

/**
 * Delete a template
 */
export async function deleteTemplate(userId: number, templateId: number): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
  }

  try {
    // First check if template exists
    const existing = await db
      .select()
      .from(reportTemplates)
      .where(and(eq(reportTemplates.id, templateId), eq(reportTemplates.createdBy, userId)))
      .limit(1);

    if (existing.length === 0) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Template not found" });
    }

    await db
      .delete(reportTemplates)
      .where(and(eq(reportTemplates.id, templateId), eq(reportTemplates.createdBy, userId)));
  } catch (error) {
    if (error instanceof TRPCError) throw error;
    console.error("[ReportTemplates] Error deleting template:", error);
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to delete template",
    });
  }
}

/**
 * Update a template
 */
export async function updateTemplate(
  userId: number,
  templateId: number,
  name: string,
  description: string | undefined,
  filters: ReportFilter,
  selectedFields: ReportFieldOption[]
): Promise<SavedTemplate> {
  const db = await getDb();
  if (!db) {
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
  }

  try {
    // First check if template exists
    const existing = await db
      .select()
      .from(reportTemplates)
      .where(and(eq(reportTemplates.id, templateId), eq(reportTemplates.createdBy, userId)))
      .limit(1);

    if (existing.length === 0) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Template not found" });
    }

    await db
      .update(reportTemplates)
      .set({
        name,
        description,
        filters: JSON.stringify(filters),
        selectedFields: JSON.stringify(selectedFields),
      })
      .where(and(eq(reportTemplates.id, templateId), eq(reportTemplates.createdBy, userId)));

    return {
      id: templateId,
      name,
      description,
      filters,
      selectedFields,
      createdAt: existing[0].createdAt,
    };
  } catch (error) {
    if (error instanceof TRPCError) throw error;
    console.error("[ReportTemplates] Error updating template:", error);
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to update template",
    });
  }
}

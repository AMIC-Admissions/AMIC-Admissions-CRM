import { adminProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { fieldsConfig, studentDynamicData } from "../drizzle/schema";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { eq } from "drizzle-orm";

export const dynamicFieldsRouter = router({
  // List all field configurations
  listFieldsConfig: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    const fields = await db.select().from(fieldsConfig).orderBy(fieldsConfig.order);
    return fields;
  }),

  // Create a new field configuration
  createField: adminProcedure
    .input(
      z.object({
        fieldKey: z.string().min(1),
        fieldLabel: z.string().min(1),
        fieldType: z.enum(["text", "select", "checkbox", "date", "number"]),
        options: z.array(z.object({ label: z.string(), value: z.string() })).optional(),
        required: z.boolean().optional().default(false),
        section: z.string().optional().default("general"),
        visible: z.boolean().optional().default(true),
        order: z.number().optional().default(0),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const result = await db.insert(fieldsConfig).values({
        fieldKey: input.fieldKey,
        fieldLabel: input.fieldLabel,
        fieldType: input.fieldType,
        options: input.options || null,
        required: input.required,
        section: input.section,
        visible: input.visible,
        order: input.order,
      });
      return result;
    }),

  // Update a field configuration
  updateField: adminProcedure
    .input(
      z.object({
        id: z.number(),
        fieldLabel: z.string().optional(),
        options: z.array(z.object({ label: z.string(), value: z.string() })).optional(),
        required: z.boolean().optional(),
        section: z.string().optional(),
        visible: z.boolean().optional(),
        order: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const updateData: any = {};
      if (input.fieldLabel !== undefined) updateData.fieldLabel = input.fieldLabel;
      if (input.options !== undefined) updateData.options = input.options;
      if (input.required !== undefined) updateData.required = input.required;
      if (input.section !== undefined) updateData.section = input.section;
      if (input.visible !== undefined) updateData.visible = input.visible;
      if (input.order !== undefined) updateData.order = input.order;

      const result = await db.update(fieldsConfig).set(updateData).where(eq(fieldsConfig.id, input.id));
      return result;
    }),

  // Delete a field configuration
  deleteField: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const result = await db.delete(fieldsConfig).where(eq(fieldsConfig.id, input.id));
      return result;
    }),
});

import { z } from "zod"
import { DEFAULT_SCOPE_OPTIONS, DEFAULT_TYPE_OPTIONS, FOOTER_OPTION_VALUES, Z_FOOTER_OPTIONS } from "./utils"


// TODO: add "Ref", "Fixes", ability to change phrase "Closes/closes/closes:"
export const Config = z.object({
   check_status: z.boolean().default(true),
   commit_type: z.object({
     enable: z.boolean().default(true),
     initial_value: z.string().default('feat'),
     infer_type_from_branch: z.boolean().default(true),
     options: z.array(z.object({
      value: z.string(),
      label: z.string().optional(),
      hint: z.string().optional(),
     })).default(DEFAULT_TYPE_OPTIONS)
   }).default({}).refine(val => {
     const options = val.options.map(v => v.value)
    return options.includes(val.initial_value)
  }, (val) => ({ message: `Type: initial_value "${val.initial_value}" must exist in options` })),
   commit_scope: z.object({
     enable: z.boolean().default(true),
     initial_value: z.string().default('app'),
     options: z.array(z.object({
      value: z.string(),
      label: z.string().optional(),
      hint: z.string().optional(),
     })).default(DEFAULT_SCOPE_OPTIONS)
   }).default({})
   .refine(val => {
     const options = val.options.map(v => v.value)
    return options.includes(val.initial_value)
  }, (val) => ({ message: `Scope: initial_value "${val.initial_value}" must exist in options` })),
   check_ticket: z.object({
     infer_ticket: z.boolean().default(true),
     confirm_ticket: z.boolean().default(true),
     add_to_title: z.boolean().default(true),
     append_hashtag: z.boolean().default(false)
   }).default({}),
   commit_title: z.object({
     max_size: z.number().positive().default(70)
   }).default({}),
   commit_body: z.object({
     enable: z.boolean().default(true),
     required: z.boolean().default(false),
   }).default({}),
   commit_footer:  z.object({
     enable: z.boolean().default(true),
     initial_value: z.array(Z_FOOTER_OPTIONS).default([]),
     options: z.array(Z_FOOTER_OPTIONS).default(FOOTER_OPTION_VALUES),
   }).default({}),
   breaking_change: z.object({
      add_exclamation_to_title: z.boolean().default(true)
   }).default({}),
   confirm_commit: z.boolean().default(true)
}).default({})

export const CommitState = z.object({
  type: z.string().default(''),
  scope:z.string().default(''),
  title:z.string().default(''),
  body:z.string().default(''),
  closes:z.string().default(''),
  ticket: z.string().default(''),
  breaking_title: z.string().default(''),
  breaking_body: z.string().default(''),
  deprecates: z.string().default(''),
  deprecates_title: z.string().default(''),
  deprecates_body: z.string().default(''),
}).default({})

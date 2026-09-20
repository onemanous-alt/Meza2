export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      artifacts: {
        Row: {
          created_at: string
          description: string | null
          id: string
          identifier: string
          kind: Database["public"]["Enums"]["artifact_kind"]
          project_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          identifier: string
          kind: Database["public"]["Enums"]["artifact_kind"]
          project_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          identifier?: string
          kind?: Database["public"]["Enums"]["artifact_kind"]
          project_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "artifacts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor: string
          details: Json
          entity_id: string
          entity_table: string
          id: string
          occurred_at: string
          recorded_at: string
          source: string
          user_id: string
        }
        Insert: {
          action: string
          actor: string
          details?: Json
          entity_id: string
          entity_table: string
          id?: string
          occurred_at: string
          recorded_at?: string
          source: string
          user_id: string
        }
        Update: {
          action?: string
          actor?: string
          details?: Json
          entity_id?: string
          entity_table?: string
          id?: string
          occurred_at?: string
          recorded_at?: string
          source?: string
          user_id?: string
        }
        Relationships: []
      }
      checkpoints: {
        Row: {
          actor: string | null
          changed_apis: string[]
          changed_files: string[]
          changed_tables: string[]
          created_at: string
          cycle_id: string | null
          decisions: string | null
          done_summary: string
          id: string
          is_final: boolean
          issues: string | null
          last_successful_step: string
          next_action: string
          project_id: string
          remaining: string | null
          status: Database["public"]["Enums"]["task_status"]
          task_id: string
          tests: string | null
        }
        Insert: {
          actor?: string | null
          changed_apis?: string[]
          changed_files?: string[]
          changed_tables?: string[]
          created_at?: string
          cycle_id?: string | null
          decisions?: string | null
          done_summary: string
          id?: string
          is_final?: boolean
          issues?: string | null
          last_successful_step: string
          next_action: string
          project_id: string
          remaining?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          task_id: string
          tests?: string | null
        }
        Update: {
          actor?: string | null
          changed_apis?: string[]
          changed_files?: string[]
          changed_tables?: string[]
          created_at?: string
          cycle_id?: string | null
          decisions?: string | null
          done_summary?: string
          id?: string
          is_final?: boolean
          issues?: string | null
          last_successful_step?: string
          next_action?: string
          project_id?: string
          remaining?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          task_id?: string
          tests?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "checkpoints_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "task_cycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkpoints_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkpoints_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      constitution_rule_history: {
        Row: {
          approved_by: string | null
          change_reason: string
          created_at: string
          id: string
          new_rule_text: string | null
          new_status: Database["public"]["Enums"]["rule_status"] | null
          old_rule_text: string | null
          old_status: Database["public"]["Enums"]["rule_status"] | null
          project_id: string
          related_task_id: string | null
          rule_id: string
        }
        Insert: {
          approved_by?: string | null
          change_reason: string
          created_at?: string
          id?: string
          new_rule_text?: string | null
          new_status?: Database["public"]["Enums"]["rule_status"] | null
          old_rule_text?: string | null
          old_status?: Database["public"]["Enums"]["rule_status"] | null
          project_id: string
          related_task_id?: string | null
          rule_id: string
        }
        Update: {
          approved_by?: string | null
          change_reason?: string
          created_at?: string
          id?: string
          new_rule_text?: string | null
          new_status?: Database["public"]["Enums"]["rule_status"] | null
          old_rule_text?: string | null
          old_status?: Database["public"]["Enums"]["rule_status"] | null
          project_id?: string
          related_task_id?: string | null
          rule_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "constitution_rule_history_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "constitution_rule_history_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "constitution_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_rule_history_task"
            columns: ["related_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      constitution_rules: {
        Row: {
          code: string | null
          created_at: string
          id: string
          keywords: string[]
          project_id: string
          rationale: string | null
          rule_text: string
          section_id: string | null
          severity: Database["public"]["Enums"]["rule_severity"]
          status: Database["public"]["Enums"]["rule_status"]
          updated_at: string
          version: number
        }
        Insert: {
          code?: string | null
          created_at?: string
          id?: string
          keywords?: string[]
          project_id: string
          rationale?: string | null
          rule_text: string
          section_id?: string | null
          severity?: Database["public"]["Enums"]["rule_severity"]
          status?: Database["public"]["Enums"]["rule_status"]
          updated_at?: string
          version?: number
        }
        Update: {
          code?: string | null
          created_at?: string
          id?: string
          keywords?: string[]
          project_id?: string
          rationale?: string | null
          rule_text?: string
          section_id?: string | null
          severity?: Database["public"]["Enums"]["rule_severity"]
          status?: Database["public"]["Enums"]["rule_status"]
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "constitution_rules_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "constitution_rules_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "constitution_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      constitution_sections: {
        Row: {
          created_at: string
          description: string | null
          id: string
          key: string
          project_id: string
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          key: string
          project_id: string
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          key?: string
          project_id?: string
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "constitution_sections_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      execution_logs: {
        Row: {
          actor: string | null
          created_at: string
          cycle_id: string | null
          description: string
          details: Json
          event_type: string
          id: string
          outcome: string | null
          project_id: string
          task_id: string | null
        }
        Insert: {
          actor?: string | null
          created_at?: string
          cycle_id?: string | null
          description: string
          details?: Json
          event_type: string
          id?: string
          outcome?: string | null
          project_id: string
          task_id?: string | null
        }
        Update: {
          actor?: string | null
          created_at?: string
          cycle_id?: string | null
          description?: string
          details?: Json
          event_type?: string
          id?: string
          outcome?: string | null
          project_id?: string
          task_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "execution_logs_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "task_cycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "execution_logs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "execution_logs_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      operating_systems: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      phases: {
        Row: {
          created_at: string
          description: string | null
          id: string
          key: string
          project_id: string
          sort_order: number
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          key: string
          project_id: string
          sort_order?: number
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          key?: string
          project_id?: string
          sort_order?: number
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "phases_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          timezone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id?: string
          timezone?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          timezone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      project_decisions: {
        Row: {
          alternatives: string | null
          created_at: string
          decided_at: string
          decided_by: string | null
          decision: string
          id: string
          impact: string | null
          project_id: string
          reason: string
          status: Database["public"]["Enums"]["decision_status"]
          superseded_by: string | null
          task_id: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          alternatives?: string | null
          created_at?: string
          decided_at?: string
          decided_by?: string | null
          decision: string
          id?: string
          impact?: string | null
          project_id: string
          reason: string
          status?: Database["public"]["Enums"]["decision_status"]
          superseded_by?: string | null
          task_id?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          alternatives?: string | null
          created_at?: string
          decided_at?: string
          decided_by?: string | null
          decision?: string
          id?: string
          impact?: string | null
          project_id?: string
          reason?: string
          status?: Database["public"]["Enums"]["decision_status"]
          superseded_by?: string | null
          task_id?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_decisions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_decisions_superseded_by_fkey"
            columns: ["superseded_by"]
            isOneToOne: false
            referencedRelation: "project_decisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_decisions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      project_description: {
        Row: {
          architecture: string | null
          core_principles: string[]
          created_at: string
          description: string | null
          fixed_facts: Json
          goal: string | null
          id: string
          integrations: string[]
          main_components: string[]
          main_systems: string[]
          problem_solved: string | null
          project_id: string
          purpose: string | null
          target_users: string | null
          technologies: string[]
          updated_at: string
          version: number
          vision: string | null
        }
        Insert: {
          architecture?: string | null
          core_principles?: string[]
          created_at?: string
          description?: string | null
          fixed_facts?: Json
          goal?: string | null
          id?: string
          integrations?: string[]
          main_components?: string[]
          main_systems?: string[]
          problem_solved?: string | null
          project_id: string
          purpose?: string | null
          target_users?: string | null
          technologies?: string[]
          updated_at?: string
          version?: number
          vision?: string | null
        }
        Update: {
          architecture?: string | null
          core_principles?: string[]
          created_at?: string
          description?: string | null
          fixed_facts?: Json
          goal?: string | null
          id?: string
          integrations?: string[]
          main_components?: string[]
          main_systems?: string[]
          problem_solved?: string | null
          project_id?: string
          purpose?: string | null
          target_users?: string | null
          technologies?: string[]
          updated_at?: string
          version?: number
          vision?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_description_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_description_history: {
        Row: {
          change_reason: string | null
          changed_by: string | null
          created_at: string
          id: string
          project_id: string
          snapshot: Json
          version: number
        }
        Insert: {
          change_reason?: string | null
          changed_by?: string | null
          created_at?: string
          id?: string
          project_id: string
          snapshot: Json
          version: number
        }
        Update: {
          change_reason?: string | null
          changed_by?: string | null
          created_at?: string
          id?: string
          project_id?: string
          snapshot?: Json
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "project_description_history_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_execution_summary: {
        Row: {
          created_at: string
          current_focus: string | null
          current_task_id: string | null
          id: string
          is_authoritative: boolean
          last_important_point: string | null
          operational_constraints: string[]
          overall_state: string | null
          project_id: string
          stack: string | null
          updated_at: string
          what_is_project: string | null
        }
        Insert: {
          created_at?: string
          current_focus?: string | null
          current_task_id?: string | null
          id?: string
          is_authoritative?: boolean
          last_important_point?: string | null
          operational_constraints?: string[]
          overall_state?: string | null
          project_id: string
          stack?: string | null
          updated_at?: string
          what_is_project?: string | null
        }
        Update: {
          created_at?: string
          current_focus?: string | null
          current_task_id?: string | null
          id?: string
          is_authoritative?: boolean
          last_important_point?: string | null
          operational_constraints?: string[]
          overall_state?: string | null
          project_id?: string
          stack?: string | null
          updated_at?: string
          what_is_project?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_summary_current_task"
            columns: ["current_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_execution_summary_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          created_at: string
          id: string
          name: string
          owner_id: string
          slug: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          owner_id?: string
          slug?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          owner_id?: string
          slug?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      resume_packages: {
        Row: {
          completed: string | null
          created_at: string
          current_state: string | null
          cycle_id: string | null
          id: string
          is_active: boolean
          last_checkpoint_id: string | null
          last_known_good_state: string | null
          next_action: string
          project_id: string
          relevant_apis: string[]
          relevant_decisions: string[]
          relevant_files: string[]
          relevant_rules: string[]
          relevant_tables: string[]
          remaining: string | null
          task_id: string
          updated_at: string
        }
        Insert: {
          completed?: string | null
          created_at?: string
          current_state?: string | null
          cycle_id?: string | null
          id?: string
          is_active?: boolean
          last_checkpoint_id?: string | null
          last_known_good_state?: string | null
          next_action: string
          project_id: string
          relevant_apis?: string[]
          relevant_decisions?: string[]
          relevant_files?: string[]
          relevant_rules?: string[]
          relevant_tables?: string[]
          remaining?: string | null
          task_id: string
          updated_at?: string
        }
        Update: {
          completed?: string | null
          created_at?: string
          current_state?: string | null
          cycle_id?: string | null
          id?: string
          is_active?: boolean
          last_checkpoint_id?: string | null
          last_known_good_state?: string | null
          next_action?: string
          project_id?: string
          relevant_apis?: string[]
          relevant_decisions?: string[]
          relevant_files?: string[]
          relevant_rules?: string[]
          relevant_tables?: string[]
          remaining?: string | null
          task_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "resume_packages_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "task_cycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resume_packages_last_checkpoint_id_fkey"
            columns: ["last_checkpoint_id"]
            isOneToOne: false
            referencedRelation: "checkpoints"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resume_packages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resume_packages_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      state_conflicts: {
        Row: {
          created_at: string
          description: string
          finding: string | null
          id: string
          inspected_scope: string | null
          project_id: string
          resolution: string | null
          source_a: string | null
          source_b: string | null
          status: Database["public"]["Enums"]["conflict_status"]
          task_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          finding?: string | null
          id?: string
          inspected_scope?: string | null
          project_id: string
          resolution?: string | null
          source_a?: string | null
          source_b?: string | null
          status?: Database["public"]["Enums"]["conflict_status"]
          task_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          finding?: string | null
          id?: string
          inspected_scope?: string | null
          project_id?: string
          resolution?: string | null
          source_a?: string | null
          source_b?: string | null
          status?: Database["public"]["Enums"]["conflict_status"]
          task_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "state_conflicts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "state_conflicts_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      system_component_drafts: {
        Row: {
          body: string
          created_at: string
          id: string
          key: string
          kind: string
          sort_order: number
          status: string
          system_id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          body?: string
          created_at?: string
          id?: string
          key: string
          kind?: string
          sort_order?: number
          status?: string
          system_id: string
          title: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          key?: string
          kind?: string
          sort_order?: number
          status?: string
          system_id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scd_system_fk"
            columns: ["system_id", "user_id"]
            isOneToOne: false
            referencedRelation: "operating_systems"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      system_component_versions: {
        Row: {
          change_reason: string
          component_id: string
          created_at: string
          definition: Json
          id: string
          kind: string
          lifecycle_state: string
          occurred_at: string
          previous_version_id: string | null
          recorded_at: string
          recorded_by: string
          source: string
          system_id: string
          system_version_id: string
          title: string
          user_id: string
          version_number: number
        }
        Insert: {
          change_reason: string
          component_id: string
          created_at?: string
          definition?: Json
          id?: string
          kind: string
          lifecycle_state?: string
          occurred_at: string
          previous_version_id?: string | null
          recorded_at?: string
          recorded_by: string
          source?: string
          system_id: string
          system_version_id: string
          title: string
          user_id: string
          version_number: number
        }
        Update: {
          change_reason?: string
          component_id?: string
          created_at?: string
          definition?: Json
          id?: string
          kind?: string
          lifecycle_state?: string
          occurred_at?: string
          previous_version_id?: string | null
          recorded_at?: string
          recorded_by?: string
          source?: string
          system_id?: string
          system_version_id?: string
          title?: string
          user_id?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "scv_component_fk"
            columns: ["component_id", "system_id"]
            isOneToOne: false
            referencedRelation: "system_components"
            referencedColumns: ["id", "system_id"]
          },
          {
            foreignKeyName: "scv_prev_fk"
            columns: ["previous_version_id", "component_id"]
            isOneToOne: false
            referencedRelation: "system_component_versions"
            referencedColumns: ["id", "component_id"]
          },
          {
            foreignKeyName: "scv_system_fk"
            columns: ["system_id", "user_id"]
            isOneToOne: false
            referencedRelation: "operating_systems"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "scv_system_version_fk"
            columns: ["system_version_id", "system_id"]
            isOneToOne: false
            referencedRelation: "system_versions"
            referencedColumns: ["id", "system_id"]
          },
        ]
      }
      system_components: {
        Row: {
          created_at: string
          current_version_id: string | null
          id: string
          key: string
          kind: string
          status: string
          system_id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_version_id?: string | null
          id?: string
          key: string
          kind?: string
          status?: string
          system_id: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_version_id?: string | null
          id?: string
          key?: string
          kind?: string
          status?: string
          system_id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "system_components_current_version_fk"
            columns: ["current_version_id", "id"]
            isOneToOne: false
            referencedRelation: "system_component_versions"
            referencedColumns: ["id", "component_id"]
          },
          {
            foreignKeyName: "system_components_system_fk"
            columns: ["system_id", "user_id"]
            isOneToOne: false
            referencedRelation: "operating_systems"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      system_draft_proposals: {
        Row: {
          advantages: string | null
          applied_version_id: string | null
          base_version_id: string | null
          change_summary: string
          changes: Json
          components: Json
          created_at: string
          id: string
          instruction: string | null
          knowledge_type: string
          model: string | null
          name: string | null
          occurred_at: string
          parent_proposal_id: string | null
          recorded_at: string
          recorded_by: string
          revision_number: number
          source: string
          source_evidence: Json
          status: string
          system_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          advantages?: string | null
          applied_version_id?: string | null
          base_version_id?: string | null
          change_summary: string
          changes?: Json
          components?: Json
          created_at?: string
          id?: string
          instruction?: string | null
          knowledge_type?: string
          model?: string | null
          name?: string | null
          occurred_at?: string
          parent_proposal_id?: string | null
          recorded_at?: string
          recorded_by?: string
          revision_number?: number
          source?: string
          source_evidence?: Json
          status?: string
          system_id: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          advantages?: string | null
          applied_version_id?: string | null
          base_version_id?: string | null
          change_summary?: string
          changes?: Json
          components?: Json
          created_at?: string
          id?: string
          instruction?: string | null
          knowledge_type?: string
          model?: string | null
          name?: string | null
          occurred_at?: string
          parent_proposal_id?: string | null
          recorded_at?: string
          recorded_by?: string
          revision_number?: number
          source?: string
          source_evidence?: Json
          status?: string
          system_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sdp_system_fk"
            columns: ["system_id", "user_id"]
            isOneToOne: false
            referencedRelation: "operating_systems"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "system_draft_proposals_applied_version_id_fkey"
            columns: ["applied_version_id"]
            isOneToOne: false
            referencedRelation: "system_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "system_draft_proposals_base_version_id_fkey"
            columns: ["base_version_id"]
            isOneToOne: false
            referencedRelation: "system_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "system_draft_proposals_parent_proposal_id_fkey"
            columns: ["parent_proposal_id"]
            isOneToOne: false
            referencedRelation: "system_draft_proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      system_versions: {
        Row: {
          change_summary: string
          created_at: string
          id: string
          name: string | null
          occurred_at: string
          parent_version_id: string | null
          recorded_at: string
          recorded_by: string
          snapshot: Json
          snapshot_hash: string
          source: string
          system_id: string
          user_id: string
          version_number: number
        }
        Insert: {
          change_summary: string
          created_at?: string
          id?: string
          name?: string | null
          occurred_at: string
          parent_version_id?: string | null
          recorded_at?: string
          recorded_by: string
          snapshot: Json
          snapshot_hash: string
          source?: string
          system_id: string
          user_id: string
          version_number: number
        }
        Update: {
          change_summary?: string
          created_at?: string
          id?: string
          name?: string | null
          occurred_at?: string
          parent_version_id?: string | null
          recorded_at?: string
          recorded_by?: string
          snapshot?: Json
          snapshot_hash?: string
          source?: string
          system_id?: string
          user_id?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "system_versions_parent_fk"
            columns: ["parent_version_id", "system_id"]
            isOneToOne: false
            referencedRelation: "system_versions"
            referencedColumns: ["id", "system_id"]
          },
          {
            foreignKeyName: "system_versions_system_fk"
            columns: ["system_id", "user_id"]
            isOneToOne: false
            referencedRelation: "operating_systems"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      task_artifacts: {
        Row: {
          action: Database["public"]["Enums"]["artifact_action"]
          artifact_id: string
          created_at: string
          cycle_id: string | null
          id: string
          project_id: string
          purpose: string | null
          task_id: string
        }
        Insert: {
          action?: Database["public"]["Enums"]["artifact_action"]
          artifact_id: string
          created_at?: string
          cycle_id?: string | null
          id?: string
          project_id: string
          purpose?: string | null
          task_id: string
        }
        Update: {
          action?: Database["public"]["Enums"]["artifact_action"]
          artifact_id?: string
          created_at?: string
          cycle_id?: string | null
          id?: string
          project_id?: string
          purpose?: string | null
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_artifacts_artifact_id_fkey"
            columns: ["artifact_id"]
            isOneToOne: false
            referencedRelation: "artifacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_artifacts_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "task_cycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_artifacts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_artifacts_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_changes: {
        Row: {
          change_reason: string | null
          changed_by: string | null
          created_at: string
          field_name: string
          id: string
          new_value: string | null
          old_value: string | null
          project_id: string
          task_id: string
        }
        Insert: {
          change_reason?: string | null
          changed_by?: string | null
          created_at?: string
          field_name: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          project_id: string
          task_id: string
        }
        Update: {
          change_reason?: string | null
          changed_by?: string | null
          created_at?: string
          field_name?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          project_id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_changes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_changes_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_constitution_rules: {
        Row: {
          created_at: string
          id: string
          project_id: string
          relevance_note: string | null
          rule_id: string
          task_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          project_id: string
          relevance_note?: string | null
          rule_id: string
          task_id: string
        }
        Update: {
          created_at?: string
          id?: string
          project_id?: string
          relevance_note?: string | null
          rule_id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_constitution_rules_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_constitution_rules_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "constitution_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_constitution_rules_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_cycles: {
        Row: {
          closed_at: string | null
          cycle_number: number
          id: string
          opened_at: string
          outcome: string | null
          project_id: string
          reason: string | null
          task_id: string
        }
        Insert: {
          closed_at?: string | null
          cycle_number?: number
          id?: string
          opened_at?: string
          outcome?: string | null
          project_id: string
          reason?: string | null
          task_id: string
        }
        Update: {
          closed_at?: string | null
          cycle_number?: number
          id?: string
          opened_at?: string
          outcome?: string | null
          project_id?: string
          reason?: string | null
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_cycles_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_cycles_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_dependencies: {
        Row: {
          created_at: string
          dependency_type: string
          depends_on_task_id: string
          id: string
          project_id: string
          task_id: string
        }
        Insert: {
          created_at?: string
          dependency_type?: string
          depends_on_task_id: string
          id?: string
          project_id: string
          task_id: string
        }
        Update: {
          created_at?: string
          dependency_type?: string
          depends_on_task_id?: string
          id?: string
          project_id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_dependencies_depends_on_task_id_fkey"
            columns: ["depends_on_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_dependencies_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_dependencies_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_relations: {
        Row: {
          created_at: string
          id: string
          note: string | null
          project_id: string
          related_task_id: string
          relation_type: string
          task_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          note?: string | null
          project_id: string
          related_task_id: string
          relation_type?: string
          task_id: string
        }
        Update: {
          created_at?: string
          id?: string
          note?: string | null
          project_id?: string
          related_task_id?: string
          relation_type?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_relations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_relations_related_task_id_fkey"
            columns: ["related_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_relations_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          cancelled_at: string | null
          code: string | null
          completed_at: string | null
          created_at: string
          deleted_at: string | null
          description: string | null
          execution_approach: string | null
          execution_steps: Json
          goal: string | null
          id: string
          keywords: string[]
          last_executor: string | null
          last_known_good_state: string | null
          next_action: string | null
          notes: string | null
          parent_task_id: string | null
          phase_id: string | null
          priority: number
          project_id: string
          reason: string | null
          required_relations: string | null
          required_tools: string[]
          risks: string | null
          scope: string | null
          started_at: string | null
          status: Database["public"]["Enums"]["task_status"]
          success_criteria: string | null
          testing_method: string | null
          title: string
          updated_at: string
        }
        Insert: {
          cancelled_at?: string | null
          code?: string | null
          completed_at?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          execution_approach?: string | null
          execution_steps?: Json
          goal?: string | null
          id?: string
          keywords?: string[]
          last_executor?: string | null
          last_known_good_state?: string | null
          next_action?: string | null
          notes?: string | null
          parent_task_id?: string | null
          phase_id?: string | null
          priority?: number
          project_id: string
          reason?: string | null
          required_relations?: string | null
          required_tools?: string[]
          risks?: string | null
          scope?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          success_criteria?: string | null
          testing_method?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          cancelled_at?: string | null
          code?: string | null
          completed_at?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          execution_approach?: string | null
          execution_steps?: Json
          goal?: string | null
          id?: string
          keywords?: string[]
          last_executor?: string | null
          last_known_good_state?: string | null
          next_action?: string | null
          notes?: string | null
          parent_task_id?: string | null
          phase_id?: string | null
          priority?: number
          project_id?: string
          reason?: string | null
          required_relations?: string | null
          required_tools?: string[]
          risks?: string | null
          scope?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          success_criteria?: string | null
          testing_method?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_parent_task_id_fkey"
            columns: ["parent_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_phase_id_fkey"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "phases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      version_adoptions: {
        Row: {
          adoption_type: string
          created_at: string
          id: string
          occurred_at: string
          reason: string | null
          recorded_at: string
          recorded_by: string
          sequence_no: number
          source: string
          supersedes_adoption_id: string | null
          system_id: string
          system_version_id: string
          user_id: string
        }
        Insert: {
          adoption_type: string
          created_at?: string
          id?: string
          occurred_at: string
          reason?: string | null
          recorded_at?: string
          recorded_by: string
          sequence_no?: number
          source?: string
          supersedes_adoption_id?: string | null
          system_id: string
          system_version_id: string
          user_id: string
        }
        Update: {
          adoption_type?: string
          created_at?: string
          id?: string
          occurred_at?: string
          reason?: string | null
          recorded_at?: string
          recorded_by?: string
          sequence_no?: number
          source?: string
          supersedes_adoption_id?: string | null
          system_id?: string
          system_version_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "va_supersedes_fk"
            columns: ["supersedes_adoption_id", "system_id"]
            isOneToOne: false
            referencedRelation: "v_adoption_timeline"
            referencedColumns: ["adoption_id", "system_id"]
          },
          {
            foreignKeyName: "va_supersedes_fk"
            columns: ["supersedes_adoption_id", "system_id"]
            isOneToOne: false
            referencedRelation: "v_system_current_version"
            referencedColumns: ["adoption_id", "system_id"]
          },
          {
            foreignKeyName: "va_supersedes_fk"
            columns: ["supersedes_adoption_id", "system_id"]
            isOneToOne: false
            referencedRelation: "version_adoptions"
            referencedColumns: ["id", "system_id"]
          },
          {
            foreignKeyName: "va_system_fk"
            columns: ["system_id", "user_id"]
            isOneToOne: false
            referencedRelation: "operating_systems"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "va_system_version_fk"
            columns: ["system_version_id", "system_id"]
            isOneToOne: false
            referencedRelation: "system_versions"
            referencedColumns: ["id", "system_id"]
          },
        ]
      }
    }
    Views: {
      v_adoption_timeline: {
        Row: {
          adoption_id: string | null
          adoption_type: string | null
          occurred_at: string | null
          reason: string | null
          recorded_at: string | null
          recorded_by: string | null
          sequence_no: number | null
          source: string | null
          supersedes_adoption_id: string | null
          system_id: string | null
          system_version_id: string | null
          user_id: string | null
        }
        Insert: {
          adoption_id?: string | null
          adoption_type?: string | null
          occurred_at?: string | null
          reason?: string | null
          recorded_at?: string | null
          recorded_by?: string | null
          sequence_no?: number | null
          source?: string | null
          supersedes_adoption_id?: string | null
          system_id?: string | null
          system_version_id?: string | null
          user_id?: string | null
        }
        Update: {
          adoption_id?: string | null
          adoption_type?: string | null
          occurred_at?: string | null
          reason?: string | null
          recorded_at?: string | null
          recorded_by?: string | null
          sequence_no?: number | null
          source?: string | null
          supersedes_adoption_id?: string | null
          system_id?: string | null
          system_version_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "va_supersedes_fk"
            columns: ["supersedes_adoption_id", "system_id"]
            isOneToOne: false
            referencedRelation: "v_adoption_timeline"
            referencedColumns: ["adoption_id", "system_id"]
          },
          {
            foreignKeyName: "va_supersedes_fk"
            columns: ["supersedes_adoption_id", "system_id"]
            isOneToOne: false
            referencedRelation: "v_system_current_version"
            referencedColumns: ["adoption_id", "system_id"]
          },
          {
            foreignKeyName: "va_supersedes_fk"
            columns: ["supersedes_adoption_id", "system_id"]
            isOneToOne: false
            referencedRelation: "version_adoptions"
            referencedColumns: ["id", "system_id"]
          },
          {
            foreignKeyName: "va_system_fk"
            columns: ["system_id", "user_id"]
            isOneToOne: false
            referencedRelation: "operating_systems"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "va_system_version_fk"
            columns: ["system_version_id", "system_id"]
            isOneToOne: false
            referencedRelation: "system_versions"
            referencedColumns: ["id", "system_id"]
          },
        ]
      }
      v_system_current_version: {
        Row: {
          adoption_id: string | null
          adoption_type: string | null
          occurred_at: string | null
          recorded_at: string | null
          sequence_no: number | null
          system_id: string | null
          system_version_id: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "va_system_fk"
            columns: ["system_id", "user_id"]
            isOneToOne: false
            referencedRelation: "operating_systems"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "va_system_version_fk"
            columns: ["system_version_id", "system_id"]
            isOneToOne: false
            referencedRelation: "system_versions"
            referencedColumns: ["id", "system_id"]
          },
        ]
      }
    }
    Functions: {
      apply_proposal_to_draft: {
        Args: { _proposal_id: string }
        Returns: number
      }
      get_minimal_task_context: { Args: { _task_id: string }; Returns: Json }
      os_version_at: {
        Args: { _at: string; _system_id: string }
        Returns: string
      }
      publish_system_version: {
        Args: {
          _change_summary: string
          _name?: string
          _occurred_at?: string
          _system_id: string
        }
        Returns: string
      }
      verify_system_version_snapshot: {
        Args: { _system_version_id: string }
        Returns: boolean
      }
    }
    Enums: {
      artifact_action:
        | "created"
        | "modified"
        | "deleted"
        | "inspected"
        | "verified"
      artifact_kind: "file" | "table" | "api" | "component" | "other"
      conflict_status: "open" | "investigating" | "resolved" | "dismissed"
      decision_status: "active" | "superseded" | "reverted"
      rule_severity:
        | "red_line"
        | "caution"
        | "recommendation"
        | "execution_rule"
        | "verification_rule"
      rule_status: "active" | "disabled" | "archived"
      task_status:
        | "pending"
        | "in_progress"
        | "completed"
        | "reopened"
        | "cancelled"
        | "soft_deleted"
        | "blocked"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      artifact_action: [
        "created",
        "modified",
        "deleted",
        "inspected",
        "verified",
      ],
      artifact_kind: ["file", "table", "api", "component", "other"],
      conflict_status: ["open", "investigating", "resolved", "dismissed"],
      decision_status: ["active", "superseded", "reverted"],
      rule_severity: [
        "red_line",
        "caution",
        "recommendation",
        "execution_rule",
        "verification_rule",
      ],
      rule_status: ["active", "disabled", "archived"],
      task_status: [
        "pending",
        "in_progress",
        "completed",
        "reopened",
        "cancelled",
        "soft_deleted",
        "blocked",
      ],
    },
  },
} as const

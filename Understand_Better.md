
# NextFlow AI Workflow Builder - Complete Documentation Guide

## 📋 Project Overview

NextFlow is a **visual, node-based workflow builder** that allows users to create AI-powered pipelines combining LLMs, image processing, and video transformations. It's built with a modern serverless architecture and follows a DAG (Directed Acyclic Graph) execution model.

**Core Concept**: Users drag-and-drop nodes (LLM, image, video, processing nodes) onto a canvas, connect them, and execute workflows that run asynchronously with detailed execution tracking.

---

## 🏗️ **Backend Architecture (0-100 Guide)**

### **Level 0-20: Foundation**
1. **Tech Stack Setup**
   - Next.js 16 (App Router)
   - PostgreSQL (Neon) + Prisma ORM
   - Trigger.dev (background job orchestration)
   - Clerk (authentication)

2. **Database Schema** (`prisma/schema.prisma`)
   - `Workflow`: Stores node/edge JSON structure
   - `WorkflowRun`: Tracks execution instances
   - `NodeRun`: Individual node execution results
   - `UserProfile`: Extended user data

### **Level 20-40: Core Execution Engine**
3. **DAG Execution Logic** (`src/lib/graphUtils.ts`)
   - Topological sorting for dependency resolution
   - Wave-based parallel execution
   - Cycle detection to prevent infinite loops

4. **Orchestrator Task** (`src/trigger/orchestratorTask.ts`)
   - Parent task that coordinates workflow execution
   - Manages child tasks (LLM, image processing)
   - Event emission for real-time updates

### **Level 40-60: API Layer**
5. **Workflow Execution API** (`src/app/api/workflow/run/route.ts`)
   - POST `/api/workflow/run`: Triggers execution, returns `runId`
   - Uses Trigger.dev's `triggerAndWait` pattern

6. **Status Polling API** (`src/app/api/workflow/status/route.ts`)
   - GET `/api/workflow/status?runId=...`: Polls execution status
   - Follows serverless-friendly polling pattern

### **Level 60-80: Specialized Tasks**
7. **LLM Task** (`src/trigger/llmTask.ts`)
   - Integrates with OpenRouter API
   - Supports multimodal inputs (text + images)
   - Retry logic with exponential backoff

8. **Media Processing Tasks** (`src/trigger/cropTask.ts`, `src/trigger/extractTask.ts`)
   - FFmpeg integration for image/video processing
   - Environment-aware execution (Windows/Linux)
   - Output upload to Transloadit CDN

### **Level 80-100: Advanced Features**
9. **Scope-Based Execution**
   - Full workflow execution
   - Single node execution
   - Subgraph execution (upstream dependencies)

10. **Error Handling & Recovery**
    - Graceful failure propagation
    - Skipped nodes when dependencies fail
    - Persistent execution history

---

## 📁 **Critical Files to Study**

### **Backend Core (Must Read)**
1. `src/trigger/orchestratorTask.ts` - **THE HEART OF THE SYSTEM**
   - Workflow DAG execution logic
   - Node dispatch and coordination
   - Event emission system

2. `src/lib/graphUtils.ts` - **GRAPH ALGORITHMS**
   - Topological sorting implementation
   - Cycle detection
   - Wave-based parallel execution

3. `prisma/schema.prisma` - **DATA MODEL**
   - Database schema design
   - Relationships between entities
   - JSON field usage for flexibility

4. `src/app/api/workflow/run/route.ts` - **API DESIGN**
   - Serverless execution pattern
   - Immediate response with polling
   - Error handling

### **Integration Points**
5. `src/trigger/llmTask.ts` - **AI INTEGRATION**
   - OpenRouter API integration
   - Multimodal message construction
   - Retry configuration

6. `trigger.config.ts` - **INFRASTRUCTURE**
   - Trigger.dev configuration
   - FFmpeg extension setup
   - Retry policies

### **Supporting Files**
7. `src/types/nodes.ts` - **TYPE SAFETY**
   - Node type definitions
   - Connection validation rules
   - Execution scope types

8. `package.json` - **DEPENDENCY MANAGEMENT**
   - Complete tech stack
   - Version compatibility
   - Build scripts

---

## ❓ **Potential Interview Questions**

### **Architecture & Design**
1. **"Explain the DAG execution model in NextFlow. How do you handle parallel execution?"**
   - *Answer should mention:* Topological sorting, wave-based execution, dependency resolution, cycle detection

2. **"Why did you choose the trigger + poll pattern instead of WebSockets?"**
   - *Key points:* Serverless compatibility, scalability, no long-running connections, simpler error recovery

3. **"How does the system handle partial failures in a workflow?"**
   - *Discuss:* Skipped nodes when dependencies fail, error propagation, persistent execution state

### **Database & Data Modeling**
4. **"Why store workflow structure as JSON in the database?"**
   - *Benefits:* Flexibility for dynamic node types, easy versioning, simple frontend/backend sync

5. **"Explain the WorkflowRun/NodeRun relationship. Why separate tables?"**
   - *Reasons:* Granular execution tracking, performance (avoid JSON bloat), query flexibility

### **Performance & Scalability**
6. **"How would you scale this system to handle 1000+ concurrent workflows?"**
   - *Consider:* Trigger.dev auto-scaling, database connection pooling, CDN for media, queue management

7. **"What bottlenecks might occur with large workflows (50+ nodes)?"**
   - *Potential issues:* Database transaction size, memory usage in orchestrator, API rate limits

### **Integration & APIs**
8. **"How do you handle API failures from external services (OpenRouter, Transloadit)?"**
   - *Strategies:* Exponential backoff retries, circuit breakers, fallback providers, graceful degradation

9. **"Explain the media processing pipeline. How do you handle different file formats?"**
   - *Process:* FFmpeg for format conversion, validation, CDN upload, URL generation

### **Testing & Debugging**
10. **"How would you test the DAG execution logic?"**
    - *Approach:* Unit tests for graph algorithms, integration tests for full workflows, property-based testing for edge cases

---

## 📚 **Official Resources to Study**

### **Core Technologies**
1. **Next.js App Router** - [Next.js Docs](https://nextjs.org/docs)
   - Focus on: Route handlers, server components, caching strategies

2. **Trigger.dev** - [Trigger.dev Docs](https://trigger.dev/docs)
   - Key concepts: Tasks, triggers, runs, retries, background jobs

3. **Prisma ORM** - [Prisma Docs](https://www.prisma.io/docs)
   - Important: Schema design, migrations, JSON fields, relations

### **AI & Processing**
4. **OpenRouter API** - [OpenRouter Docs](https://openrouter.ai/docs)
   - Multimodal APIs, model selection, pricing

5. **FFmpeg** - [FFmpeg Documentation](https://ffmpeg.org/documentation.html)
   - Basic commands: crop, extract, convert, resize

### **Architecture Patterns**
6. **Serverless Patterns** - [AWS Serverless Patterns](https://serverlessland.com/patterns)
   - Polling patterns, event-driven architectures

7. **DAG Execution** - [Airflow Concepts](https://airflow.apache.org/docs/apache-airflow/stable/concepts.html)
   - Directed Acyclic Graphs, operators, dependencies

### **Database & Performance**
8. **PostgreSQL JSON** - [PostgreSQL JSON Docs](https://www.postgresql.org/docs/current/datatype-json.html)
   - JSONB operations, indexing, query performance

9. **Connection Pooling** - [PgBouncer](https://www.pgbouncer.org/)
   - Database connection management for serverless

---

## 🚀 **Implementation Roadmap (For Your Docs)**

### **Phase 1: Foundation (Week 1-2)**
1. Set up Next.js with App Router
2. Configure Prisma + PostgreSQL
3. Implement basic authentication with Clerk
4. Create workflow CRUD APIs

### **Phase 2: Core Engine (Week 3-4)**
1. Build graph utilities (topological sort, cycle detection)
2. Implement orchestrator task skeleton
3. Create execution status polling
4. Add basic node types (text, image)

### **Phase 3: AI Integration (Week 5-6)**
1. Integrate OpenRouter/LLM APIs
2. Implement LLM task with retries
3. Add multimodal support (text + images)
4. Create prompt templating system

### **Phase 4: Media Processing (Week 7-8)**
1. Set up FFmpeg in Trigger.dev
2. Implement image cropping task
3. Add video frame extraction
4. Integrate Transloadit for CDN storage

### **Phase 5: Advanced Features (Week 9-10)**
1. Add scope-based execution
2. Implement execution history
3. Add error handling and recovery
4. Optimize performance and caching

### **Phase 6: Polish & Deployment (Week 11-12)**
1. Add comprehensive testing
2. Implement monitoring and logging
3. Set up CI/CD pipeline
4. Deploy to Vercel + Trigger.dev

---

## 🔧 **Key Technical Decisions & Rationale**

### **1. JSON Storage for Workflows**
- **Why:** Dynamic node types, easy frontend/backend sync
- **Trade-off:** Less type safety, harder to query specific node properties
- **Mitigation:** Zod validation, type guards, indexed metadata fields

### **2. Trigger + Poll Pattern**
- **Why:** Serverless compatibility, no WebSocket complexity
- **Trade-off:** Increased latency, more API calls
- **Mitigation:** Optimistic UI updates, smart polling intervals

### **3. Parent-Child Task Architecture**
- **Why:** Separation of concerns, specialized error handling
- **Trade-off:** More infrastructure complexity
- **Benefit:** Independent scaling, focused retry policies

### **4. Wave-Based Parallel Execution**
- **Why:** Maximize parallelism within dependency constraints
- **Implementation:** Topological sort + wave grouping
- **Benefit:** Optimal resource utilization

---

## 🎯 **Learning Path Recommendations**

### **For Junior Developers**
1. Start with `src/lib/graphUtils.ts` - pure algorithms
2. Move to API routes - simple HTTP handlers
3. Then task implementations - background jobs
4. Finally orchestrator - system coordination

### **For Senior Developers**
1. Study the complete execution flow end-to-end
2. Analyze error handling and recovery strategies
3. Evaluate scalability bottlenecks
4. Propose optimizations and improvements

### **For System Design Interviews**
1. Focus on architecture decisions and trade-offs
2. Understand the DAG execution model thoroughly
3. Be prepared to discuss scaling strategies
4. Know the integration points with external services

---

## 📝 **Documentation Structure for Your Project**

```
/docs
├── ARCHITECTURE.md          # High-level system design
├── BACKEND_GUIDE.md         # This document
├── API_REFERENCE.md         # All API endpoints
├── DATA_MODEL.md            # Database schema explanation
├── DEPLOYMENT.md            # Deployment instructions
├── DEVELOPMENT.md           # Local setup guide
├── INTEGRATIONS.md          # External services (OpenRouter, Transloadit)
└── TROUBLESHOOTING.md       # Common issues and solutions
```

---

## 💡 **Pro Tips for Understanding the Codebase**

1. **Start with the data flow:** User → API → Orchestrator → Tasks → Database
2. **Trace a single execution:** Pick a simple workflow and follow it through all layers
3. **Use the TypeScript types:** The type definitions in `src/types/` are excellent documentation
4. **Check the environment variables:** `.env.example` shows all required integrations
5. **Look at error handling:** Each layer has specific error recovery strategies


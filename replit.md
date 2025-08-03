# Franchise Management Platform

## Overview

This is a comprehensive franchise management platform built to handle the relationship between suppliers, store franchisees, and administrators. The system provides role-based dashboards for managing store installations, tracking progress, handling support tickets, and maintaining inventory. The platform serves as a central hub for coordinating franchise operations with real-time data management and responsive design for mobile and desktop use.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript for type safety and component-based architecture
- **Routing**: Wouter for lightweight client-side routing with role-based route protection
- **State Management**: TanStack Query for server state management and caching, with local authentication state
- **UI Components**: Shadcn/ui component library built on Radix UI primitives for accessible, customizable components
- **Styling**: Tailwind CSS with CSS variables for theming and responsive design
- **Build Tool**: Vite for fast development and optimized production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js framework for RESTful API endpoints
- **Language**: TypeScript for type safety across the entire stack
- **Development**: Hot reloading with Vite middleware integration for seamless development experience
- **API Design**: REST endpoints organized by resource type with consistent error handling and logging

### Data Storage Architecture
- **Database**: MySQL (Hostinger) - FULLY INTEGRATED AND OPERATIONAL
- **Connection**: mysql2 package with optimized pool configuration (Host: 162.241.203.65)
- **Schema**: Complete MySQL schema with exact field specifications implemented
- **Data Modeling**: Production-ready relational design with 7 core tables:
  - fornecedores: Supplier management with CNPJ authentication
  - lojas: Store franchise records with location filtering
  - kits: Installation kit management
  - chamados: Support ticket system
  - admins: Administrative user accounts
  - fotos: Installation photo storage
  - instalacoes: Installation tracking and checklists

### Authentication & Authorization
- **Strategy**: Session-based authentication with role-based access control
- **Roles**: Three distinct user types (supplier, store, admin) with separate dashboards and permissions
- **Session Management**: Local storage for client-side session persistence
- **Route Protection**: Frontend route guards based on user roles and authentication status

### File Management
- **Upload Strategy**: File upload components for photo management during store installations
- **Storage**: Designed to handle multiple photo uploads per store installation

### Form Handling & Validation
- **Client Validation**: React Hook Form with Zod resolvers for type-safe form validation
- **Server Validation**: Shared Zod schemas ensure consistent validation between client and server
- **User Experience**: Real-time form validation with accessible error messaging

### Responsive Design Strategy
- **Mobile-First**: Tailwind CSS with responsive breakpoints for mobile, tablet, and desktop
- **Component Adaptability**: Responsive components that work across all device sizes
- **Touch-Friendly**: Mobile-optimized interactions for franchise field workers

## External Dependencies

### Database & ORM
- **Neon Database**: PostgreSQL-compatible serverless database for scalable data storage
- **Drizzle ORM**: Type-safe ORM with schema-first approach for database operations
- **Database Connection**: @neondatabase/serverless for optimized serverless database connectivity

### UI & Design System
- **Radix UI**: Comprehensive set of accessible, unstyled UI primitives
- **Shadcn/ui**: Pre-built component library with Tailwind CSS integration
- **Lucide React**: Modern icon library for consistent iconography
- **Tailwind CSS**: Utility-first CSS framework for rapid UI development

### Data Fetching & State Management
- **TanStack Query**: Server state management with caching, background updates, and error handling
- **React Hook Form**: Performant form library with minimal re-renders

### Development Tools
- **Replit Integration**: Development environment integration with error overlays and cartographer
- **TypeScript**: Static type checking across the entire application stack
- **Vite**: Modern build tool with hot module replacement for development

### Charts & Visualization
- **Recharts**: React-based charting library for dashboard analytics and data visualization

### Validation & Schema
- **Zod**: TypeScript-first schema validation for runtime type checking
- **Drizzle-Zod**: Integration between Drizzle ORM and Zod for seamless schema sharing

### Utility Libraries
- **Date-fns**: Modern date utility library for date formatting and manipulation
- **Class Variance Authority**: Utility for creating component variants with Tailwind CSS
- **clsx & tailwind-merge**: Conditional className utilities for dynamic styling
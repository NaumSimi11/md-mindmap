/**
 * Project Template - Project planning and tracking
 */

import { Template } from '@/services/TemplateService';

export const projectTemplate: Template = {
  id: 'project-plan',
  name: 'Project Plan',
  description: 'Complete project planning template with phases and tracking',
  category: 'business',
  icon: '🚀',
  content: `# {{project_name}}

## Project Overview
**Goal:** {{goal}}
**Timeline:** {{timeline}}
**Budget:** {{budget}}
**Team:** {{team}}

## Project Scope

### In Scope
- [Feature 1]
- [Feature 2]
- [Feature 3]

### Out of Scope
- [Not included 1]
- [Not included 2]

## Success Metrics
- [ ] {{metric1}} - Target: {{target1}}
- [ ] {{metric2}} - Target: {{target2}}
- [ ] {{metric3}} - Target: {{target3}}

## Phase 1: Planning & Setup
**Duration:** {{phase1_duration}}
**Start Date:** {{phase1_start}}
**End Date:** {{phase1_end}}

### Tasks
- [ ] Define detailed requirements
- [ ] Create wireframes/mockups
- [ ] Set up development environment
- [ ] Plan testing strategy

## Phase 2: Development
**Duration:** {{phase2_duration}}
**Start Date:** {{phase2_start}}
**End Date:** {{phase2_end}}

### Frontend Development
- [ ] Implement core UI components
- [ ] Add responsive design
- [ ] Integrate with backend API
- [ ] Implement user authentication

### Backend Development
- [ ] Set up server infrastructure
- [ ] Implement core API endpoints
- [ ] Add database integration
- [ ] Implement security measures

## Phase 3: Testing & QA
**Duration:** {{phase3_duration}}
**Start Date:** {{phase3_start}}
**End Date:** {{phase3_end}}

### Testing Tasks
- [ ] Unit testing for all components
- [ ] Integration testing
- [ ] User acceptance testing
- [ ] Performance testing
- [ ] Security testing

## Phase 4: Deployment
**Duration:** {{phase4_duration}}
**Start Date:** {{phase4_start}}
**End Date:** {{phase4_end}}

### Deployment Tasks
- [ ] Set up production environment
- [ ] Database migration
- [ ] Deploy application
- [ ] Set up monitoring
- [ ] Configure backups

## Phase 5: Launch & Monitoring
**Duration:** {{phase5_duration}}
**Start Date:** {{phase5_start}}
**End Date:** {{phase5_end}}

### Post-Launch Tasks
- [ ] Monitor application performance
- [ ] Gather user feedback
- [ ] Address critical bugs
- [ ] Plan feature enhancements

## Risk Assessment

### High Risk
- [ ] {{high_risk1}} - Mitigation: {{mitigation1}}
- [ ] {{high_risk2}} - Mitigation: {{mitigation2}}

### Medium Risk
- [ ] {{medium_risk1}} - Mitigation: {{mitigation1}}
- [ ] {{medium_risk2}} - Mitigation: {{mitigation2}}

### Low Risk
- [ ] {{low_risk1}} - Mitigation: {{mitigation1}}

## Team & Responsibilities

### Project Manager
- [ ] {{pm_name}} - Overall project coordination

### Developers
- [ ] {{dev1_name}} - {{dev1_responsibility}}
- [ ] {{dev2_name}} - {{dev2_responsibility}}

### Designers
- [ ] {{design1_name}} - {{design1_responsibility}}

### QA Team
- [ ] {{qa1_name}} - {{qa1_responsibility}}

## Communication Plan

### Regular Meetings
- **Daily Standup:** {{standup_time}} - {{standup_frequency}}
- **Weekly Review:** {{review_time}} - {{review_frequency}}
- **Monthly Planning:** {{planning_time}} - {{planning_frequency}}

### Communication Channels
- **Primary:** {{primary_channel}}
- **Backup:** {{backup_channel}}
- **Emergency:** {{emergency_channel}}

## Deliverables

### Phase 1 Deliverables
- [ ] Requirements document
- [ ] Wireframes/mockups
- [ ] Development environment setup

### Phase 2 Deliverables
- [ ] Functional frontend application
- [ ] Working backend API
- [ ] Database schema

### Phase 3 Deliverables
- [ ] Test reports
- [ ] Quality assurance sign-off
- [ ] Performance benchmarks

### Phase 4 Deliverables
- [ ] Production deployment
- [ ] Monitoring setup
- [ ] Backup configuration

### Phase 5 Deliverables
- [ ] Launch report
- [ ] User feedback summary
- [ ] Maintenance plan

## Budget Breakdown

### Development Costs
- **Frontend Development:** {{frontend_cost}}
- **Backend Development:** {{backend_cost}}
- **Database Setup:** {{database_cost}}

### Infrastructure Costs
- **Hosting:** {{hosting_cost}}
- **Domain:** {{domain_cost}}
- **SSL Certificate:** {{ssl_cost}}

### Other Costs
- **Design Assets:** {{design_cost}}
- **Marketing:** {{marketing_cost}}
- **Contingency:** {{contingency_cost}}

**Total Budget:** {{total_budget}}

---

*Project Manager:* {{pm_name}}
*Start Date:* {{start_date}}
*Target Launch:* {{launch_date}}
*Version:* {{version}}`,
  variables: [
    {
      key: 'project_name',
      label: 'Project Name',
      type: 'text',
      required: true,
      defaultValue: 'New Project',
    },
    {
      key: 'goal',
      label: 'Project Goal',
      type: 'textarea',
      required: true,
      defaultValue: 'Brief description of what this project aims to achieve.',
    },
    {
      key: 'timeline',
      label: 'Timeline',
      type: 'text',
      required: true,
      defaultValue: '3 months',
    },
    {
      key: 'budget',
      label: 'Budget',
      type: 'text',
      required: false,
      defaultValue: '$50,000',
    },
    {
      key: 'team',
      label: 'Team Members',
      type: 'text',
      required: true,
      defaultValue: 'John Doe (PM), Jane Smith (Dev), Bob Johnson (Design)',
    },
    {
      key: 'metric1',
      label: 'Success Metric 1',
      type: 'text',
      required: true,
      defaultValue: 'User acquisition rate',
    },
    {
      key: 'target1',
      label: 'Target for Metric 1',
      type: 'text',
      required: true,
      defaultValue: '1000 users/month',
    },
    {
      key: 'metric2',
      label: 'Success Metric 2',
      type: 'text',
      required: true,
      defaultValue: 'Conversion rate',
    },
    {
      key: 'target2',
      label: 'Target for Metric 2',
      type: 'text',
      required: true,
      defaultValue: '15%',
    },
    {
      key: 'metric3',
      label: 'Success Metric 3',
      type: 'text',
      required: true,
      defaultValue: 'Customer satisfaction',
    },
    {
      key: 'target3',
      label: 'Target for Metric 3',
      type: 'text',
      required: true,
      defaultValue: '4.5/5 stars',
    },
  ],
  metadata: {
    author: 'MD Creator',
    tags: ['project', 'planning', 'management', 'business'],
    version: '1.0.0',
    lastModified: '2024-01-01T00:00:00.000Z',
    createdAt: '2024-01-01T00:00:00.000Z',
  },
};

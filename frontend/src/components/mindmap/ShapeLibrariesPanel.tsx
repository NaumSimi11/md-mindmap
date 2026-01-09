/**
 * ShapeLibrariesPanel - Left Sidebar Shape Libraries (like diagrams.net)
 *
 * Features:
 * - Categorized shape libraries (General, Flowchart, UML, etc.)
 * - Drag & drop shapes onto canvas
 * - Search functionality
 * - Expandable/collapsible categories
 * - Quick access to frequently used shapes
 */

import React, { useState, useMemo } from 'react';
import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

interface ShapeLibraryItem {
  id: string;
  name: string;
  icon: string;
  category: string;
  nodeType: 'mind' | 'milestone' | 'icon' | 'aws' | 'flowchart' | 'uml' | 'standaloneIcon';
  data?: any;
}

interface ShapeLibrariesPanelProps {
  onAddShape: (shape: ShapeLibraryItem) => void;
  isOpen: boolean;
  onToggle: () => void;
}

const shapeLibraries: ShapeLibraryItem[] = [
  // ═══════════════════════════════════════════════════════════
  // 1️⃣ GENERAL SHAPES - Primary building blocks (FIRST!)
  // ═══════════════════════════════════════════════════════════
  { id: 'rectangle', name: 'Rectangle', icon: 'tabler:rectangle', category: 'General', nodeType: 'mind' },
  { id: 'circle', name: 'Circle', icon: 'tabler:circle', category: 'General', nodeType: 'mind' },
  { id: 'diamond', name: 'Diamond', icon: 'tabler:diamond', category: 'General', nodeType: 'mind' },
  { id: 'triangle', name: 'Triangle', icon: 'tabler:triangle', category: 'General', nodeType: 'mind' },
  { id: 'hexagon', name: 'Hexagon', icon: 'tabler:hexagon', category: 'General', nodeType: 'mind' },
  { id: 'star', name: 'Star', icon: 'tabler:star', category: 'General', nodeType: 'mind' },
  { id: 'square', name: 'Square', icon: 'tabler:square', category: 'General', nodeType: 'mind' },
  { id: 'oval', name: 'Oval', icon: 'tabler:oval', category: 'General', nodeType: 'mind' },

  // ═══════════════════════════════════════════════════════════
  // 2️⃣ MIND MAP - Mindmap-specific shapes (SECOND!)
  // ═══════════════════════════════════════════════════════════
  { id: 'milestone', name: 'Milestone', icon: 'tabler:flag', category: 'Mind Map', nodeType: 'milestone' },
  { id: 'idea', name: 'Idea', icon: 'tabler:lightbulb', category: 'Mind Map', nodeType: 'mind' },
  { id: 'goal', name: 'Goal', icon: 'tabler:target', category: 'Mind Map', nodeType: 'mind' },
  { id: 'task', name: 'Task', icon: 'tabler:check-square', category: 'Mind Map', nodeType: 'mind' },
  { id: 'question', name: 'Question', icon: 'tabler:help', category: 'Mind Map', nodeType: 'mind' },
  { id: 'problem', name: 'Problem', icon: 'tabler:alert-triangle', category: 'Mind Map', nodeType: 'mind' },
  { id: 'solution', name: 'Solution', icon: 'tabler:check-circle', category: 'Mind Map', nodeType: 'mind' },
  { id: 'benefit', name: 'Benefit', icon: 'tabler:trending-up', category: 'Mind Map', nodeType: 'mind' },

  // ═══════════════════════════════════════════════════════════
  // 3️⃣ TECH STACK LOGOS - Colored, beautiful (THIRD!)
  // ═══════════════════════════════════════════════════════════
  
  // Frontend
  { id: 'logo-react', name: 'React', icon: 'logos:react', category: '🎨 Tech Stack', nodeType: 'standaloneIcon', data: { icon: 'logos:react', size: 48 } },
  { id: 'logo-vue', name: 'Vue', icon: 'logos:vue', category: '🎨 Tech Stack', nodeType: 'standaloneIcon', data: { icon: 'logos:vue', size: 48 } },
  { id: 'logo-angular', name: 'Angular', icon: 'logos:angular-icon', category: '🎨 Tech Stack', nodeType: 'standaloneIcon', data: { icon: 'logos:angular-icon', size: 48 } },
  { id: 'logo-svelte', name: 'Svelte', icon: 'logos:svelte-icon', category: '🎨 Tech Stack', nodeType: 'standaloneIcon', data: { icon: 'logos:svelte-icon', size: 48 } },
  { id: 'logo-nextjs', name: 'Next.js', icon: 'logos:nextjs-icon', category: '🎨 Tech Stack', nodeType: 'standaloneIcon', data: { icon: 'logos:nextjs-icon', size: 48 } },
  { id: 'logo-tailwind', name: 'Tailwind', icon: 'logos:tailwindcss-icon', category: '🎨 Tech Stack', nodeType: 'standaloneIcon', data: { icon: 'logos:tailwindcss-icon', size: 48 } },
  
  // Backend
  { id: 'logo-nodejs', name: 'Node.js', icon: 'logos:nodejs-icon', category: '🎨 Tech Stack', nodeType: 'standaloneIcon', data: { icon: 'logos:nodejs-icon', size: 48 } },
  { id: 'logo-deno', name: 'Deno', icon: 'logos:deno', category: '🎨 Tech Stack', nodeType: 'standaloneIcon', data: { icon: 'logos:deno', size: 48 } },
  { id: 'logo-express', name: 'Express', icon: 'logos:express', category: '🎨 Tech Stack', nodeType: 'standaloneIcon', data: { icon: 'logos:express', size: 48 } },
  { id: 'logo-nestjs', name: 'NestJS', icon: 'logos:nestjs', category: '🎨 Tech Stack', nodeType: 'standaloneIcon', data: { icon: 'logos:nestjs', size: 48 } },
  { id: 'logo-django', name: 'Django', icon: 'logos:django-icon', category: '🎨 Tech Stack', nodeType: 'standaloneIcon', data: { icon: 'logos:django-icon', size: 48 } },
  { id: 'logo-flask', name: 'Flask', icon: 'logos:flask', category: '🎨 Tech Stack', nodeType: 'standaloneIcon', data: { icon: 'logos:flask', size: 48 } },
  { id: 'logo-fastapi', name: 'FastAPI', icon: 'logos:fastapi-icon', category: '🎨 Tech Stack', nodeType: 'standaloneIcon', data: { icon: 'logos:fastapi-icon', size: 48 } },
  { id: 'logo-spring', name: 'Spring', icon: 'logos:spring-icon', category: '🎨 Tech Stack', nodeType: 'standaloneIcon', data: { icon: 'logos:spring-icon', size: 48 } },
  { id: 'logo-laravel', name: 'Laravel', icon: 'logos:laravel', category: '🎨 Tech Stack', nodeType: 'standaloneIcon', data: { icon: 'logos:laravel', size: 48 } },
  
  // Languages
  { id: 'logo-javascript', name: 'JavaScript', icon: 'logos:javascript', category: '🎨 Tech Stack', nodeType: 'standaloneIcon', data: { icon: 'logos:javascript', size: 48 } },
  { id: 'logo-typescript', name: 'TypeScript', icon: 'logos:typescript-icon', category: '🎨 Tech Stack', nodeType: 'standaloneIcon', data: { icon: 'logos:typescript-icon', size: 48 } },
  { id: 'logo-python', name: 'Python', icon: 'logos:python', category: '🎨 Tech Stack', nodeType: 'standaloneIcon', data: { icon: 'logos:python', size: 48 } },
  { id: 'logo-java', name: 'Java', icon: 'logos:java', category: '🎨 Tech Stack', nodeType: 'standaloneIcon', data: { icon: 'logos:java', size: 48 } },
  { id: 'logo-go', name: 'Go', icon: 'logos:go', category: '🎨 Tech Stack', nodeType: 'standaloneIcon', data: { icon: 'logos:go', size: 48 } },
  { id: 'logo-rust', name: 'Rust', icon: 'logos:rust', category: '🎨 Tech Stack', nodeType: 'standaloneIcon', data: { icon: 'logos:rust', size: 48 } },
  { id: 'logo-php', name: 'PHP', icon: 'logos:php', category: '🎨 Tech Stack', nodeType: 'standaloneIcon', data: { icon: 'logos:php', size: 48 } },
  { id: 'logo-ruby', name: 'Ruby', icon: 'logos:ruby', category: '🎨 Tech Stack', nodeType: 'standaloneIcon', data: { icon: 'logos:ruby', size: 48 } },
  
  // Databases
  { id: 'logo-postgresql', name: 'PostgreSQL', icon: 'logos:postgresql', category: '🎨 Tech Stack', nodeType: 'standaloneIcon', data: { icon: 'logos:postgresql', size: 48 } },
  { id: 'logo-mysql', name: 'MySQL', icon: 'logos:mysql-icon', category: '🎨 Tech Stack', nodeType: 'standaloneIcon', data: { icon: 'logos:mysql-icon', size: 48 } },
  { id: 'logo-mongodb', name: 'MongoDB', icon: 'logos:mongodb-icon', category: '🎨 Tech Stack', nodeType: 'standaloneIcon', data: { icon: 'logos:mongodb-icon', size: 48 } },
  { id: 'logo-redis', name: 'Redis', icon: 'logos:redis', category: '🎨 Tech Stack', nodeType: 'standaloneIcon', data: { icon: 'logos:redis', size: 48 } },
  { id: 'logo-elasticsearch', name: 'Elasticsearch', icon: 'logos:elasticsearch', category: '🎨 Tech Stack', nodeType: 'standaloneIcon', data: { icon: 'logos:elasticsearch', size: 48 } },
  
  // DevOps
  { id: 'logo-docker', name: 'Docker', icon: 'logos:docker-icon', category: '🎨 Tech Stack', nodeType: 'standaloneIcon', data: { icon: 'logos:docker-icon', size: 48 } },
  { id: 'logo-kubernetes', name: 'Kubernetes', icon: 'logos:kubernetes', category: '🎨 Tech Stack', nodeType: 'standaloneIcon', data: { icon: 'logos:kubernetes', size: 48 } },
  { id: 'logo-terraform', name: 'Terraform', icon: 'logos:terraform-icon', category: '🎨 Tech Stack', nodeType: 'standaloneIcon', data: { icon: 'logos:terraform-icon', size: 48 } },
  { id: 'logo-github', name: 'GitHub', icon: 'logos:github-icon', category: '🎨 Tech Stack', nodeType: 'standaloneIcon', data: { icon: 'logos:github-icon', size: 48 } },
  { id: 'logo-gitlab', name: 'GitLab', icon: 'logos:gitlab', category: '🎨 Tech Stack', nodeType: 'standaloneIcon', data: { icon: 'logos:gitlab', size: 48 } },
  { id: 'logo-git', name: 'Git', icon: 'logos:git-icon', category: '🎨 Tech Stack', nodeType: 'standaloneIcon', data: { icon: 'logos:git-icon', size: 48 } },
  { id: 'logo-nginx', name: 'Nginx', icon: 'logos:nginx', category: '🎨 Tech Stack', nodeType: 'standaloneIcon', data: { icon: 'logos:nginx', size: 48 } },
  
  // Design
  { id: 'logo-figma', name: 'Figma', icon: 'logos:figma', category: '🎨 Tech Stack', nodeType: 'standaloneIcon', data: { icon: 'logos:figma', size: 48 } },
  { id: 'logo-vscode', name: 'VS Code', icon: 'logos:visual-studio-code', category: '🎨 Tech Stack', nodeType: 'standaloneIcon', data: { icon: 'logos:visual-studio-code', size: 48 } },

  // ═══════════════════════════════════════════════════════════
  // FLOWCHART SHAPES
  // ═══════════════════════════════════════════════════════════
  { id: 'process', name: 'Process', icon: 'tabler:rectangle', category: 'Flowchart', nodeType: 'flowchart' },
  { id: 'decision', name: 'Decision', icon: 'tabler:diamond', category: 'Flowchart', nodeType: 'flowchart' },
  { id: 'start-end', name: 'Start/End', icon: 'tabler:circle', category: 'Flowchart', nodeType: 'flowchart' },
  { id: 'input-output', name: 'Input/Output', icon: 'tabler:arrows-right-left', category: 'Flowchart', nodeType: 'flowchart' },
  { id: 'connector', name: 'Connector', icon: 'tabler:circle-dotted', category: 'Flowchart', nodeType: 'flowchart' },
  { id: 'data', name: 'Data', icon: 'tabler:database', category: 'Flowchart', nodeType: 'flowchart' },
  { id: 'document', name: 'Document', icon: 'tabler:file-text', category: 'Flowchart', nodeType: 'flowchart' },
  { id: 'delay', name: 'Delay', icon: 'tabler:clock-pause', category: 'Flowchart', nodeType: 'flowchart' },

  // ═══════════════════════════════════════════════════════════
  // UML SHAPES
  // ═══════════════════════════════════════════════════════════
  { id: 'uml-class', name: 'Class', icon: 'tabler:rectangle', category: 'UML', nodeType: 'uml' },
  { id: 'uml-interface', name: 'Interface', icon: 'tabler:link', category: 'UML', nodeType: 'uml' },
  { id: 'uml-abstract', name: 'Abstract Class', icon: 'tabler:italics', category: 'UML', nodeType: 'uml' },
  { id: 'uml-package', name: 'Package', icon: 'tabler:package', category: 'UML', nodeType: 'uml' },
  { id: 'uml-actor', name: 'Actor', icon: 'tabler:user-check', category: 'UML', nodeType: 'uml' },
  { id: 'uml-usecase', name: 'Use Case', icon: 'tabler:circle', category: 'UML', nodeType: 'uml' },

  // ═══════════════════════════════════════════════════════════
  // AWS - All services in one category (with official colors!)
  // ═══════════════════════════════════════════════════════════
  
  // Compute (Orange #FF9900)
  { id: 'aws-ec2', name: 'EC2', icon: 'tabler:server', category: '☁️ AWS', nodeType: 'standaloneIcon', data: { icon: 'tabler:server', color: '#FF9900', size: 48 } },
  { id: 'aws-lambda', name: 'Lambda', icon: 'tabler:code', category: '☁️ AWS', nodeType: 'standaloneIcon', data: { icon: 'tabler:code', color: '#FF9900', size: 48 } },
  { id: 'aws-ecs', name: 'ECS', icon: 'tabler:container', category: '☁️ AWS', nodeType: 'standaloneIcon', data: { icon: 'tabler:container', color: '#FF9900', size: 48 } },
  { id: 'aws-eks', name: 'EKS', icon: 'tabler:brand-kubernetes', category: '☁️ AWS', nodeType: 'standaloneIcon', data: { icon: 'tabler:brand-kubernetes', color: '#FF9900', size: 48 } },
  { id: 'aws-fargate', name: 'Fargate', icon: 'tabler:box', category: '☁️ AWS', nodeType: 'standaloneIcon', data: { icon: 'tabler:box', color: '#FF9900', size: 48 } },
  
  // Storage (Green #569A31)
  { id: 'aws-s3', name: 'S3', icon: 'tabler:bucket', category: '☁️ AWS', nodeType: 'standaloneIcon', data: { icon: 'tabler:bucket', color: '#569A31', size: 48 } },
  { id: 'aws-ebs', name: 'EBS', icon: 'tabler:disc', category: '☁️ AWS', nodeType: 'standaloneIcon', data: { icon: 'tabler:disc', color: '#569A31', size: 48 } },
  { id: 'aws-efs', name: 'EFS', icon: 'tabler:folders', category: '☁️ AWS', nodeType: 'standaloneIcon', data: { icon: 'tabler:folders', color: '#569A31', size: 48 } },
  
  // Database (Blue #527FFF)
  { id: 'aws-rds', name: 'RDS', icon: 'tabler:database', category: '☁️ AWS', nodeType: 'standaloneIcon', data: { icon: 'tabler:database', color: '#527FFF', size: 48 } },
  { id: 'aws-dynamodb', name: 'DynamoDB', icon: 'tabler:table', category: '☁️ AWS', nodeType: 'standaloneIcon', data: { icon: 'tabler:table', color: '#527FFF', size: 48 } },
  { id: 'aws-elasticache', name: 'ElastiCache', icon: 'tabler:bolt', category: '☁️ AWS', nodeType: 'standaloneIcon', data: { icon: 'tabler:bolt', color: '#527FFF', size: 48 } },
  { id: 'aws-redshift', name: 'Redshift', icon: 'tabler:chart-dots', category: '☁️ AWS', nodeType: 'standaloneIcon', data: { icon: 'tabler:chart-dots', color: '#527FFF', size: 48 } },
  { id: 'aws-aurora', name: 'Aurora', icon: 'tabler:database-star', category: '☁️ AWS', nodeType: 'standaloneIcon', data: { icon: 'tabler:database-star', color: '#527FFF', size: 48 } },
  
  // Networking (Purple #8C4FFF)
  { id: 'aws-cloudfront', name: 'CloudFront', icon: 'tabler:world', category: '☁️ AWS', nodeType: 'standaloneIcon', data: { icon: 'tabler:world', color: '#8C4FFF', size: 48 } },
  { id: 'aws-route53', name: 'Route53', icon: 'tabler:route', category: '☁️ AWS', nodeType: 'standaloneIcon', data: { icon: 'tabler:route', color: '#8C4FFF', size: 48 } },
  { id: 'aws-vpc', name: 'VPC', icon: 'tabler:network', category: '☁️ AWS', nodeType: 'standaloneIcon', data: { icon: 'tabler:network', color: '#8C4FFF', size: 48 } },
  { id: 'aws-elb', name: 'Load Balancer', icon: 'tabler:scale', category: '☁️ AWS', nodeType: 'standaloneIcon', data: { icon: 'tabler:scale', color: '#8C4FFF', size: 48 } },
  
  // Integration (Pink #FF4F8B)
  { id: 'aws-sqs', name: 'SQS', icon: 'tabler:message-circle', category: '☁️ AWS', nodeType: 'standaloneIcon', data: { icon: 'tabler:message-circle', color: '#FF4F8B', size: 48 } },
  { id: 'aws-sns', name: 'SNS', icon: 'tabler:bell-ringing', category: '☁️ AWS', nodeType: 'standaloneIcon', data: { icon: 'tabler:bell-ringing', color: '#FF4F8B', size: 48 } },
  { id: 'aws-eventbridge', name: 'EventBridge', icon: 'tabler:calendar-event', category: '☁️ AWS', nodeType: 'standaloneIcon', data: { icon: 'tabler:calendar-event', color: '#FF4F8B', size: 48 } },
  { id: 'aws-kinesis', name: 'Kinesis', icon: 'tabler:wave-sine', category: '☁️ AWS', nodeType: 'standaloneIcon', data: { icon: 'tabler:wave-sine', color: '#FF4F8B', size: 48 } },
  { id: 'aws-api-gateway', name: 'API Gateway', icon: 'tabler:api', category: '☁️ AWS', nodeType: 'standaloneIcon', data: { icon: 'tabler:api', color: '#FF4F8B', size: 48 } },
  { id: 'aws-step-functions', name: 'Step Functions', icon: 'tabler:git-branch', category: '☁️ AWS', nodeType: 'standaloneIcon', data: { icon: 'tabler:git-branch', color: '#FF4F8B', size: 48 } },
  
  // Analytics (Orange #FF9900)
  { id: 'aws-athena', name: 'Athena', icon: 'tabler:search', category: '☁️ AWS', nodeType: 'standaloneIcon', data: { icon: 'tabler:search', color: '#FF9900', size: 48 } },
  { id: 'aws-glue', name: 'Glue', icon: 'tabler:transform', category: '☁️ AWS', nodeType: 'standaloneIcon', data: { icon: 'tabler:transform', color: '#FF9900', size: 48 } },
  { id: 'aws-sagemaker', name: 'SageMaker', icon: 'tabler:brain', category: '☁️ AWS', nodeType: 'standaloneIcon', data: { icon: 'tabler:brain', color: '#FF9900', size: 48 } },
  
  // Security (Red #DD344C)
  { id: 'aws-iam', name: 'IAM', icon: 'tabler:shield-lock', category: '☁️ AWS', nodeType: 'standaloneIcon', data: { icon: 'tabler:shield-lock', color: '#DD344C', size: 48 } },
  { id: 'aws-cognito', name: 'Cognito', icon: 'tabler:user-check', category: '☁️ AWS', nodeType: 'standaloneIcon', data: { icon: 'tabler:user-check', color: '#DD344C', size: 48 } },
  { id: 'aws-kms', name: 'KMS', icon: 'tabler:lock', category: '☁️ AWS', nodeType: 'standaloneIcon', data: { icon: 'tabler:lock', color: '#DD344C', size: 48 } },
  { id: 'aws-waf', name: 'WAF', icon: 'tabler:shield', category: '☁️ AWS', nodeType: 'standaloneIcon', data: { icon: 'tabler:shield', color: '#DD344C', size: 48 } },
  
  // Monitoring (Pink #FF4F8B)
  { id: 'aws-cloudwatch', name: 'CloudWatch', icon: 'tabler:activity', category: '☁️ AWS', nodeType: 'standaloneIcon', data: { icon: 'tabler:activity', color: '#FF4F8B', size: 48 } },
  { id: 'aws-cloudformation', name: 'CloudFormation', icon: 'tabler:stack', category: '☁️ AWS', nodeType: 'standaloneIcon', data: { icon: 'tabler:stack', color: '#FF4F8B', size: 48 } },

  // Databases
  { id: 'db-postgresql', name: 'PostgreSQL', icon: 'tabler:database', category: 'Databases', nodeType: 'icon', data: { icon: 'tabler:database', title: 'PostgreSQL' } },
  { id: 'db-mysql', name: 'MySQL', icon: 'tabler:database-heart', category: 'Databases', nodeType: 'icon', data: { icon: 'tabler:database-heart', title: 'MySQL' } },
  { id: 'db-mongodb', name: 'MongoDB', icon: 'tabler:database-star', category: 'Databases', nodeType: 'icon', data: { icon: 'tabler:database-star', title: 'MongoDB' } },
  { id: 'db-redis', name: 'Redis', icon: 'tabler:database-cog', category: 'Databases', nodeType: 'icon', data: { icon: 'tabler:database-cog', title: 'Redis' } },
  { id: 'db-sqlite', name: 'SQLite', icon: 'tabler:database', category: 'Databases', nodeType: 'icon', data: { icon: 'tabler:database', title: 'SQLite' } },
  { id: 'db-cassandra', name: 'Cassandra', icon: 'tabler:database-plus', category: 'Databases', nodeType: 'icon', data: { icon: 'tabler:database-plus', title: 'Cassandra' } },
  { id: 'db-elasticsearch', name: 'Elasticsearch', icon: 'tabler:search', category: 'Databases', nodeType: 'icon', data: { icon: 'tabler:search', title: 'Elasticsearch' } },
  { id: 'db-kafka', name: 'Kafka', icon: 'tabler:message-queue', category: 'Databases', nodeType: 'icon', data: { icon: 'tabler:message-queue', title: 'Kafka' } },
  { id: 'db-rabbitmq', name: 'RabbitMQ', icon: 'tabler:rabbit', category: 'Databases', nodeType: 'icon', data: { icon: 'tabler:rabbit', title: 'RabbitMQ' } },

  // Programming Languages & Frameworks
  { id: 'lang-javascript', name: 'JavaScript', icon: 'tabler:brand-javascript', category: 'Languages', nodeType: 'icon', data: { icon: 'tabler:brand-javascript', title: 'JavaScript' } },
  { id: 'lang-typescript', name: 'TypeScript', icon: 'tabler:brand-typescript', category: 'Languages', nodeType: 'icon', data: { icon: 'tabler:brand-typescript', title: 'TypeScript' } },
  { id: 'lang-python', name: 'Python', icon: 'tabler:brand-python', category: 'Languages', nodeType: 'icon', data: { icon: 'tabler:brand-python', title: 'Python' } },
  { id: 'lang-java', name: 'Java', icon: 'tabler:brand-java', category: 'Languages', nodeType: 'icon', data: { icon: 'tabler:brand-java', title: 'Java' } },
  { id: 'lang-csharp', name: 'C#', icon: 'tabler:code', category: 'Languages', nodeType: 'icon', data: { icon: 'tabler:code', title: 'C#' } },
  { id: 'lang-go', name: 'Go', icon: 'tabler:brand-golang', category: 'Languages', nodeType: 'icon', data: { icon: 'tabler:brand-golang', title: 'Go' } },
  { id: 'lang-rust', name: 'Rust', icon: 'tabler:anchor', category: 'Languages', nodeType: 'icon', data: { icon: 'tabler:anchor', title: 'Rust' } },
  { id: 'lang-php', name: 'PHP', icon: 'tabler:brand-php', category: 'Languages', nodeType: 'icon', data: { icon: 'tabler:brand-php', title: 'PHP' } },
  { id: 'lang-ruby', name: 'Ruby', icon: 'tabler:diamond', category: 'Languages', nodeType: 'icon', data: { icon: 'tabler:diamond', title: 'Ruby' } },
  { id: 'lang-swift', name: 'Swift', icon: 'tabler:brand-apple', category: 'Languages', nodeType: 'icon', data: { icon: 'tabler:brand-apple', title: 'Swift' } },
  { id: 'lang-kotlin', name: 'Kotlin', icon: 'tabler:brand-android', category: 'Languages', nodeType: 'icon', data: { icon: 'tabler:brand-android', title: 'Kotlin' } },
  { id: 'lang-scala', name: 'Scala', icon: 'tabler:zoom-in', category: 'Languages', nodeType: 'icon', data: { icon: 'tabler:zoom-in', title: 'Scala' } },

  // Frameworks & Libraries
  { id: 'fw-react', name: 'React', icon: 'tabler:brand-react', category: 'Frameworks', nodeType: 'icon', data: { icon: 'tabler:brand-react', title: 'React' } },
  { id: 'fw-vue', name: 'Vue.js', icon: 'tabler:brand-vue', category: 'Frameworks', nodeType: 'icon', data: { icon: 'tabler:brand-vue', title: 'Vue.js' } },
  { id: 'fw-angular', name: 'Angular', icon: 'tabler:brand-angular', category: 'Frameworks', nodeType: 'icon', data: { icon: 'tabler:brand-angular', title: 'Angular' } },
  { id: 'fw-svelte', name: 'Svelte', icon: 'tabler:brand-svelte', category: 'Frameworks', nodeType: 'icon', data: { icon: 'tabler:brand-svelte', title: 'Svelte' } },
  { id: 'fw-nextjs', name: 'Next.js', icon: 'tabler:file-text', category: 'Frameworks', nodeType: 'icon', data: { icon: 'tabler:file-text', title: 'Next.js' } },
  { id: 'fw-nuxt', name: 'Nuxt.js', icon: 'tabler:brand-nuxt', category: 'Frameworks', nodeType: 'icon', data: { icon: 'tabler:brand-nuxt', title: 'Nuxt.js' } },
  { id: 'fw-express', name: 'Express', icon: 'tabler:server', category: 'Frameworks', nodeType: 'icon', data: { icon: 'tabler:server', title: 'Express' } },
  { id: 'fw-fastapi', name: 'FastAPI', icon: 'tabler:api', category: 'Frameworks', nodeType: 'icon', data: { icon: 'tabler:api', title: 'FastAPI' } },
  { id: 'fw-django', name: 'Django', icon: 'tabler:brand-django', category: 'Frameworks', nodeType: 'icon', data: { icon: 'tabler:brand-django', title: 'Django' } },
  { id: 'fw-flask', name: 'Flask', icon: 'tabler:beaker', category: 'Frameworks', nodeType: 'icon', data: { icon: 'tabler:beaker', title: 'Flask' } },
  { id: 'fw-spring', name: 'Spring', icon: 'tabler:leaf', category: 'Frameworks', nodeType: 'icon', data: { icon: 'tabler:leaf', title: 'Spring' } },
  { id: 'fw-dotnet', name: '.NET', icon: 'tabler:brand-dotnet', category: 'Frameworks', nodeType: 'icon', data: { icon: 'tabler:brand-dotnet', title: '.NET' } },
  { id: 'fw-nodejs', name: 'Node.js', icon: 'tabler:brand-nodejs', category: 'Frameworks', nodeType: 'icon', data: { icon: 'tabler:brand-nodejs', title: 'Node.js' } },

  // DevOps & Tools
  { id: 'tool-docker', name: 'Docker', icon: 'tabler:brand-docker', category: 'DevOps', nodeType: 'icon', data: { icon: 'tabler:brand-docker', title: 'Docker' } },
  { id: 'tool-kubernetes', name: 'Kubernetes', icon: 'tabler:brand-kubernetes', category: 'DevOps', nodeType: 'icon', data: { icon: 'tabler:brand-kubernetes', title: 'Kubernetes' } },
  { id: 'tool-jenkins', name: 'Jenkins', icon: 'tabler:brand-jenkins', category: 'DevOps', nodeType: 'icon', data: { icon: 'tabler:brand-jenkins', title: 'Jenkins' } },
  { id: 'tool-gitlab', name: 'GitLab', icon: 'tabler:brand-gitlab', category: 'DevOps', nodeType: 'icon', data: { icon: 'tabler:brand-gitlab', title: 'GitLab' } },
  { id: 'tool-github', name: 'GitHub', icon: 'tabler:brand-github', category: 'DevOps', nodeType: 'icon', data: { icon: 'tabler:brand-github', title: 'GitHub' } },
  { id: 'tool-terraform', name: 'Terraform', icon: 'tabler:mountain', category: 'DevOps', nodeType: 'icon', data: { icon: 'tabler:mountain', title: 'Terraform' } },
  { id: 'tool-ansible', name: 'Ansible', icon: 'tabler:settings-automation', category: 'DevOps', nodeType: 'icon', data: { icon: 'tabler:settings-automation', title: 'Ansible' } },
  { id: 'tool-prometheus', name: 'Prometheus', icon: 'tabler:chart-line', category: 'DevOps', nodeType: 'icon', data: { icon: 'tabler:chart-line', title: 'Prometheus' } },
  { id: 'tool-grafana', name: 'Grafana', icon: 'tabler:chart-bar', category: 'DevOps', nodeType: 'icon', data: { icon: 'tabler:chart-bar', title: 'Grafana' } },

  // ═══════════════════════════════════════════════════════════
  // Google Cloud - All services in one category (with Google colors!)
  // ═══════════════════════════════════════════════════════════
  
  { id: 'gcp-compute-engine', name: 'Compute Engine', icon: 'tabler:server', category: '🔵 Google Cloud', nodeType: 'standaloneIcon', data: { icon: 'tabler:server', color: '#4285F4', size: 48 } },
  { id: 'gcp-cloud-functions', name: 'Cloud Functions', icon: 'tabler:code', category: '🔵 Google Cloud', nodeType: 'standaloneIcon', data: { icon: 'tabler:code', color: '#4285F4', size: 48 } },
  { id: 'gcp-kubernetes-engine', name: 'GKE', icon: 'tabler:brand-kubernetes', category: '🔵 Google Cloud', nodeType: 'standaloneIcon', data: { icon: 'tabler:brand-kubernetes', color: '#4285F4', size: 48 } },
  { id: 'gcp-cloud-run', name: 'Cloud Run', icon: 'tabler:rocket', category: '🔵 Google Cloud', nodeType: 'standaloneIcon', data: { icon: 'tabler:rocket', color: '#4285F4', size: 48 } },
  { id: 'gcp-cloud-storage', name: 'Cloud Storage', icon: 'tabler:bucket', category: '🔵 Google Cloud', nodeType: 'standaloneIcon', data: { icon: 'tabler:bucket', color: '#34A853', size: 48 } },
  { id: 'gcp-cloud-sql', name: 'Cloud SQL', icon: 'tabler:database', category: '🔵 Google Cloud', nodeType: 'standaloneIcon', data: { icon: 'tabler:database', color: '#4285F4', size: 48 } },
  { id: 'gcp-firestore', name: 'Firestore', icon: 'tabler:flame', category: '🔵 Google Cloud', nodeType: 'standaloneIcon', data: { icon: 'tabler:flame', color: '#FBBC04', size: 48 } },
  { id: 'gcp-bigtable', name: 'Bigtable', icon: 'tabler:table', category: '🔵 Google Cloud', nodeType: 'standaloneIcon', data: { icon: 'tabler:table', color: '#4285F4', size: 48 } },
  { id: 'gcp-pub-sub', name: 'Pub/Sub', icon: 'tabler:message-circle', category: '🔵 Google Cloud', nodeType: 'standaloneIcon', data: { icon: 'tabler:message-circle', color: '#EA4335', size: 48 } },
  { id: 'gcp-bigquery', name: 'BigQuery', icon: 'tabler:chart-dots', category: '🔵 Google Cloud', nodeType: 'standaloneIcon', data: { icon: 'tabler:chart-dots', color: '#669DF6', size: 48 } },
  { id: 'gcp-vertex-ai', name: 'Vertex AI', icon: 'tabler:brain', category: '🔵 Google Cloud', nodeType: 'standaloneIcon', data: { icon: 'tabler:brain', color: '#FBBC04', size: 48 } },
  
  // ═══════════════════════════════════════════════════════════
  // Microsoft Azure - All services in one category (Azure Blue!)
  // ═══════════════════════════════════════════════════════════
  
  { id: 'azure-vm', name: 'Virtual Machines', icon: 'tabler:server', category: '🔷 Azure', nodeType: 'standaloneIcon', data: { icon: 'tabler:server', color: '#0078D4', size: 48 } },
  { id: 'azure-functions', name: 'Functions', icon: 'tabler:code', category: '🔷 Azure', nodeType: 'standaloneIcon', data: { icon: 'tabler:code', color: '#0078D4', size: 48 } },
  { id: 'azure-aks', name: 'AKS', icon: 'tabler:brand-kubernetes', category: '🔷 Azure', nodeType: 'standaloneIcon', data: { icon: 'tabler:brand-kubernetes', color: '#0078D4', size: 48 } },
  { id: 'azure-app-service', name: 'App Service', icon: 'tabler:apps', category: '🔷 Azure', nodeType: 'standaloneIcon', data: { icon: 'tabler:apps', color: '#0078D4', size: 48 } },
  { id: 'azure-storage', name: 'Storage', icon: 'tabler:bucket', category: '🔷 Azure', nodeType: 'standaloneIcon', data: { icon: 'tabler:bucket', color: '#0078D4', size: 48 } },
  { id: 'azure-sql', name: 'SQL Database', icon: 'tabler:database', category: '🔷 Azure', nodeType: 'standaloneIcon', data: { icon: 'tabler:database', color: '#0078D4', size: 48 } },
  { id: 'azure-cosmos-db', name: 'Cosmos DB', icon: 'tabler:world', category: '🔷 Azure', nodeType: 'standaloneIcon', data: { icon: 'tabler:world', color: '#0078D4', size: 48 } },
  { id: 'azure-cache-redis', name: 'Cache for Redis', icon: 'tabler:bolt', category: '🔷 Azure', nodeType: 'standaloneIcon', data: { icon: 'tabler:bolt', color: '#0078D4', size: 48 } },
  { id: 'azure-service-bus', name: 'Service Bus', icon: 'tabler:message-circle', category: '🔷 Azure', nodeType: 'standaloneIcon', data: { icon: 'tabler:message-circle', color: '#0078D4', size: 48 } },
  { id: 'azure-active-directory', name: 'Active Directory', icon: 'tabler:user-check', category: '🔷 Azure', nodeType: 'standaloneIcon', data: { icon: 'tabler:user-check', color: '#0078D4', size: 48 } },

  // Cloud Platforms (legacy - keeping for compatibility)
  { id: 'cloud-gcp', name: 'Google Cloud', icon: 'tabler:brand-google', category: 'Cloud', nodeType: 'icon', data: { icon: 'tabler:brand-google', title: 'Google Cloud' } },
  { id: 'cloud-azure', name: 'Azure', icon: 'tabler:brand-azure', category: 'Cloud', nodeType: 'icon', data: { icon: 'tabler:brand-azure', title: 'Azure' } },
  { id: 'cloud-digitalocean', name: 'DigitalOcean', icon: 'tabler:wave-square', category: 'Cloud', nodeType: 'icon', data: { icon: 'tabler:wave-square', title: 'DigitalOcean' } },
  { id: 'cloud-heroku', name: 'Heroku', icon: 'tabler:brand-heroku', category: 'Cloud', nodeType: 'icon', data: { icon: 'tabler:brand-heroku', title: 'Heroku' } },
  { id: 'cloud-vercel', name: 'Vercel', icon: 'tabler:triangle', category: 'Cloud', nodeType: 'icon', data: { icon: 'tabler:triangle', title: 'Vercel' } },
  { id: 'cloud-netlify', name: 'Netlify', icon: 'tabler:brand-netlify', category: 'Cloud', nodeType: 'icon', data: { icon: 'tabler:brand-netlify', title: 'Netlify' } },

  // Infrastructure
  { id: 'infra-nginx', name: 'Nginx', icon: 'tabler:server-cog', category: 'Infrastructure', nodeType: 'icon', data: { icon: 'tabler:server-cog', title: 'Nginx' } },
  { id: 'infra-apache', name: 'Apache', icon: 'tabler:server', category: 'Infrastructure', nodeType: 'icon', data: { icon: 'tabler:server', title: 'Apache' } },
  { id: 'infra-redis', name: 'Redis', icon: 'tabler:database-cog', category: 'Infrastructure', nodeType: 'icon', data: { icon: 'tabler:database-cog', title: 'Redis' } },
  { id: 'infra-rabbitmq', name: 'RabbitMQ', icon: 'tabler:rabbit', category: 'Infrastructure', nodeType: 'icon', data: { icon: 'tabler:rabbit', title: 'RabbitMQ' } },
  { id: 'infra-elasticsearch', name: 'Elasticsearch', icon: 'tabler:search', category: 'Infrastructure', nodeType: 'icon', data: { icon: 'tabler:search', title: 'Elasticsearch' } },
  { id: 'infra-kafka', name: 'Kafka', icon: 'tabler:message-queue', category: 'Infrastructure', nodeType: 'icon', data: { icon: 'tabler:message-queue', title: 'Kafka' } },

  // Generic Icons
  { id: 'icon-user', name: 'User', icon: 'tabler:user', category: 'Icons', nodeType: 'icon', data: { icon: 'tabler:user', title: 'User' } },
  { id: 'icon-users', name: 'Users', icon: 'tabler:users', category: 'Icons', nodeType: 'icon', data: { icon: 'tabler:users', title: 'Users' } },
  { id: 'icon-gear', name: 'Settings', icon: 'tabler:settings', category: 'Icons', nodeType: 'icon', data: { icon: 'tabler:settings', title: 'Settings' } },
  { id: 'icon-home', name: 'Home', icon: 'tabler:home', category: 'Icons', nodeType: 'icon', data: { icon: 'tabler:home', title: 'Home' } },
  { id: 'icon-globe', name: 'Web', icon: 'tabler:globe', category: 'Icons', nodeType: 'icon', data: { icon: 'tabler:globe', title: 'Web' } },
  { id: 'icon-mobile', name: 'Mobile', icon: 'tabler:device-mobile', category: 'Icons', nodeType: 'icon', data: { icon: 'tabler:device-mobile', title: 'Mobile' } },
  { id: 'icon-desktop', name: 'Desktop', icon: 'tabler:device-desktop', category: 'Icons', nodeType: 'icon', data: { icon: 'tabler:device-desktop', title: 'Desktop' } },
  { id: 'icon-server', name: 'Server', icon: 'tabler:server', category: 'Icons', nodeType: 'icon', data: { icon: 'tabler:server', title: 'Server' } },
  { id: 'icon-database', name: 'Database', icon: 'tabler:database', category: 'Icons', nodeType: 'icon', data: { icon: 'tabler:database', title: 'Database' } },
  { id: 'icon-cloud', name: 'Cloud', icon: 'tabler:cloud', category: 'Icons', nodeType: 'icon', data: { icon: 'tabler:cloud', title: 'Cloud' } },
  { id: 'icon-shield', name: 'Security', icon: 'tabler:shield', category: 'Icons', nodeType: 'icon', data: { icon: 'tabler:shield', title: 'Security' } },
  { id: 'icon-lock', name: 'Lock', icon: 'tabler:lock', category: 'Icons', nodeType: 'icon', data: { icon: 'tabler:lock', title: 'Lock' } },
  { id: 'icon-key', name: 'Key', icon: 'tabler:key', category: 'Icons', nodeType: 'icon', data: { icon: 'tabler:key', title: 'Key' } },
  { id: 'icon-mail', name: 'Email', icon: 'tabler:mail', category: 'Icons', nodeType: 'icon', data: { icon: 'tabler:mail', title: 'Email' } },
  { id: 'icon-message', name: 'Chat', icon: 'tabler:message', category: 'Icons', nodeType: 'icon', data: { icon: 'tabler:message', title: 'Chat' } },
  { id: 'icon-bell', name: 'Notification', icon: 'tabler:bell', category: 'Icons', nodeType: 'icon', data: { icon: 'tabler:bell', title: 'Notification' } },
  { id: 'icon-star', name: 'Favorite', icon: 'tabler:star', category: 'Icons', nodeType: 'icon', data: { icon: 'tabler:star', title: 'Favorite' } },
  { id: 'icon-heart', name: 'Love', icon: 'tabler:heart', category: 'Icons', nodeType: 'icon', data: { icon: 'tabler:heart', title: 'Love' } },
  { id: 'icon-check', name: 'Check', icon: 'tabler:check', category: 'Icons', nodeType: 'icon', data: { icon: 'tabler:check', title: 'Check' } },
  { id: 'icon-x', name: 'Close', icon: 'tabler:x', category: 'Icons', nodeType: 'icon', data: { icon: 'tabler:x', title: 'Close' } },
];

export default function ShapeLibrariesPanel({ onAddShape, isOpen, onToggle }: ShapeLibrariesPanelProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    // PRIMARY: Basic Shapes (most important - always visible)
    'General': true,
    'Flowchart': true,
    'Mind Map': true,
    'UML': false,
    
    // SECONDARY: Tech Logos (colored, at the top)
    '🎨 Tech Stack': true, // All tech logos in one category
    
    // TERTIARY: Cloud Services (all services in single categories)
    '☁️ AWS': false, // All AWS services together
    '🔵 Google Cloud': false, // All GCP services together
    '🔷 Azure': false, // All Azure services together
    
    // Legacy categories (keeping for compatibility)
    'Icons': false,
  });

  const categories = useMemo(() => {
    const cats = [...new Set(shapeLibraries.map(s => s.category))];
    return cats.sort((a, b) => {
      // NEW PRIORITY ORDER: General → Mind Map → Tech Stack → Rest
      const priority = [
        'General',           // 1️⃣ FIRST
        'Mind Map',          // 2️⃣ SECOND
        '🎨 Tech Stack',     // 3️⃣ THIRD
        'Flowchart',         // 4️⃣
        'UML',               // 5️⃣
        '☁️ AWS',            // 6️⃣
        '🔵 Google Cloud',   // 7️⃣
        '🔷 Azure',          // 8️⃣
        'Icons',
        'Databases',
        'Languages',
        'Frameworks',
        'DevOps',
        'Cloud',
        'Infrastructure'
      ];
      const aIndex = priority.indexOf(a);
      const bIndex = priority.indexOf(b);
      
      // If both are in priority list, sort by priority
      if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
      // If only a is in priority, a comes first
      if (aIndex !== -1) return -1;
      // If only b is in priority, b comes first
      if (bIndex !== -1) return 1;
      // If neither is in priority, sort alphabetically
      return a.localeCompare(b);
    });
  }, []);

  const filteredShapes = useMemo(() => {
    if (!searchTerm) return shapeLibraries;

    return shapeLibraries.filter(shape =>
      shape.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shape.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  const shapesByCategory = useMemo(() => {
    const result: Record<string, ShapeLibraryItem[]> = {};
    filteredShapes.forEach(shape => {
      if (!result[shape.category]) result[shape.category] = [];
      result[shape.category].push(shape);
    });
    return result;
  }, [filteredShapes]);

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const handleDragStart = (e: React.DragEvent, shape: ShapeLibraryItem) => {
    e.dataTransfer.setData('application/json', JSON.stringify(shape));
    e.dataTransfer.effectAllowed = 'copy';
  };

  if (!isOpen) {
    return null; // Don't render anything when closed
  }

  return (
    <div className="w-60 h-full bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-950 border-r border-slate-200/60 dark:border-slate-700/50 shadow-xl flex flex-col flex-shrink-0">
      {/* Compact Header */}
      <div className="px-3 py-2 border-b border-slate-200/60 dark:border-slate-700/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          {/* Close button only */}
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0 hover:bg-slate-100 dark:hover:bg-slate-800"
            onClick={onToggle}
            title="Close shapes panel"
          >
            <Icon icon="tabler:x" className="h-4 w-4 text-slate-600 dark:text-slate-400" />
          </Button>
        </div>

        {/* Search */}
        <div className="mt-2">
          <div className="relative">
            <Icon icon="tabler:search" className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 h-8 text-sm bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Quick Access - Most Used Shapes - ULTRA COMPACT */}
        {!searchTerm && (
          <div className="mt-2">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Icon icon="tabler:zap" className="h-3.5 w-3.5 text-amber-500 dark:text-amber-400" />
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Quick Add</span>
            </div>
            <div className="grid grid-cols-6 gap-1">
              {[
                // Most popular shapes - no labels, just icons
                { id: 'mind', name: 'Mind Node', icon: 'tabler:circle', category: 'General', nodeType: 'mind' as const },
                { id: 'milestone', name: 'Milestone', icon: 'tabler:flag', category: 'Mind Map', nodeType: 'milestone' as const },
                { id: 'rectangle', name: 'Rectangle', icon: 'tabler:rectangle', category: 'General', nodeType: 'mind' as const },
                { id: 'diamond', name: 'Decision', icon: 'tabler:diamond', category: 'Flowchart', nodeType: 'flowchart' as const },
                { id: 'icon-user', name: 'User', icon: 'tabler:user', category: 'Icons', nodeType: 'icon' as const, data: { icon: 'tabler:user', title: 'User' } },
                { id: 'aws-ec2', name: 'EC2', icon: 'tabler:server', category: 'AWS', nodeType: 'aws' as const, data: { icon: 'tabler:server', title: 'EC2' } },
                { id: 'db-postgresql', name: 'PostgreSQL', icon: 'tabler:database', category: 'Databases', nodeType: 'icon' as const, data: { icon: 'tabler:database', title: 'PostgreSQL' } },
                { id: 'fw-react', name: 'React', icon: 'tabler:brand-react', category: 'Frameworks', nodeType: 'icon' as const, data: { icon: 'tabler:brand-react', title: 'React' } },
                { id: 'lang-python', name: 'Python', icon: 'tabler:brand-python', category: 'Languages', nodeType: 'icon' as const, data: { icon: 'tabler:brand-python', title: 'Python' } },
                { id: 'tool-docker', name: 'Docker', icon: 'tabler:brand-docker', category: 'DevOps', nodeType: 'icon' as const, data: { icon: 'tabler:brand-docker', title: 'Docker' } },
                { id: 'cloud-gcp', name: 'GCP', icon: 'tabler:brand-google', category: 'Cloud', nodeType: 'icon' as const, data: { icon: 'tabler:brand-google', title: 'GCP' } },
                { id: 'icon-database', name: 'Database', icon: 'tabler:database', category: 'Icons', nodeType: 'icon' as const, data: { icon: 'tabler:database', title: 'Database' } },
              ].map(shape => (
                <button
                  key={shape.id}
                  className="group relative aspect-square bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer transition-all hover:scale-105 hover:shadow-sm flex items-center justify-center"
                  onClick={() => onAddShape(shape)}
                  title={shape.name}
                >
                  <Icon
                    icon={shape.icon}
                    className="h-4 w-4 text-slate-600 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors"
                  />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="px-3 py-2 space-y-2">
          {categories.map(category => {
            const categoryShapes = shapesByCategory[category] || [];
            if (categoryShapes.length === 0 && searchTerm) return null;

            return (
              <div key={category} className="space-y-1">
                {/* Category Header */}
                <button
                  onClick={() => toggleCategory(category)}
                  className="w-full flex items-center justify-between px-2 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <Icon icon="tabler:folder" className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                    <span className="font-medium text-xs text-slate-700 dark:text-slate-300">{category}</span>
                    <Badge variant="secondary" className="text-[10px] h-4 px-1 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400">
                      {categoryShapes.length}
                    </Badge>
                  </div>
                  <Icon
                    icon={expandedCategories[category] ? 'tabler:chevron-down' : 'tabler:chevron-right'}
                    className="h-3.5 w-3.5 text-slate-400"
                  />
                </button>

                {/* Category Shapes - COMPACT & RESPONSIVE */}
                {expandedCategories[category] && (
                  <div className="ml-1">
                    <div className="grid grid-cols-5 gap-1.5">
                      {categoryShapes.map(shape => (
                        <button
                          key={shape.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, shape)}
                          className="group relative aspect-square bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 rounded-lg cursor-grab active:cursor-grabbing transition-all hover:scale-105 hover:shadow-sm flex items-center justify-center"
                          title={shape.name}
                          onClick={() => onAddShape(shape)}
                        >
                          <Icon
                            icon={shape.icon}
                            className="h-4 w-4 text-slate-500 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors"
                          />

                          {/* Subtle drag indicator */}
                          <div className="absolute -top-0.5 -right-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {category !== categories[categories.length - 1] && <Separator />}
              </div>
            );
          })}

          {searchTerm && Object.keys(shapesByCategory).length === 0 && (
            <div className="text-center py-8">
              <Icon icon="tabler:search-off" className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No shapes found</p>
              <p className="text-xs text-muted-foreground">Try a different search term</p>
            </div>
          )}

          {/* Diagram Templates Section */}
          {!searchTerm && (
            <div className="mt-6 pt-4 border-t border-white/20">
              <div className="flex items-center gap-2 mb-3">
                <Icon icon="tabler:template" className="h-4 w-4 text-yellow-300" />
                <span className="text-sm font-semibold text-white">Diagram Templates</span>
              </div>

              <div className="space-y-2">
                {[
                  {
                    name: 'Mind Map',
                    icon: 'tabler:brain',
                    description: 'Central idea with branches',
                    pattern: 'mindmap'
                  },
                  {
                    name: 'Flowchart',
                    icon: 'tabler:git-branch',
                    description: 'Process flow diagram',
                    pattern: 'flowchart'
                  },
                  {
                    name: 'Org Chart',
                    icon: 'tabler:hierarchy',
                    description: 'Organizational structure',
                    pattern: 'org'
                  },
                  {
                    name: 'Timeline',
                    icon: 'tabler:timeline',
                    description: 'Chronological events',
                    pattern: 'timeline'
                  },
                  {
                    name: 'SWOT Analysis',
                    icon: 'tabler:analysis',
                    description: 'Strengths, weaknesses, opportunities, threats',
                    pattern: 'swot'
                  },
                  {
                    name: 'Kanban Board',
                    icon: 'tabler:columns',
                    description: 'Project management columns',
                    pattern: 'kanban'
                  },
                ].map((template) => (
                  <button
                    key={template.pattern}
                    className="w-full p-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-left transition-all hover:scale-[1.02] group"
                    onClick={() => {
                      // This would trigger template creation
                      // For now, just show a placeholder
                    }}
                    title={`Create ${template.name} template`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/20 rounded-md group-hover:bg-white/30 transition-colors">
                        <Icon icon={template.icon} className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-white">{template.name}</p>
                        <p className="text-xs text-blue-100">{template.description}</p>
                      </div>
                      <Icon icon="tabler:plus" className="h-4 w-4 text-blue-200 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-4 p-3 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-400/30 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Icon icon="tabler:sparkles" className="h-4 w-4 text-yellow-300" />
                  <span className="text-xs font-semibold text-white">Pro Tip</span>
                </div>
                <p className="text-xs text-blue-100">
                  Templates create pre-configured node layouts. Select a template to instantly populate your canvas!
                </p>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-3 border-t border-border bg-muted/30">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Drag icons to canvas</span>
          <span>{filteredShapes.length} dev icons</span>
        </div>
      </div>
    </div>
  );
}

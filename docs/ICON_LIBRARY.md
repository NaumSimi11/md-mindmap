# Icon Library (AWS/Dev/Base) — Quick Start

## Structure
```
src/
  icons/
    aws/
      Alb.tsx
      Ec2.tsx
      ...
    dev/
      (add later)
    base/
      (add later)
    index.ts  # registry + types
  components/diagram/nodes/
    AwsNode.tsx
```

## Usage
```ts
import { ReactFlow } from '@xyflow/react';
import { AwsNode } from '@/components/diagram/nodes/AwsNode';

const nodeTypes = { aws: AwsNode };

const nodes = [
  {
    id: 'alb-1',
    type: 'aws',
    position: { x: 100, y: 100 },
    data: { icon: 'aws.alb', title: 'ALB', subtitle: 'Public', status: 'ok' },
  },
  {
    id: 'ec2-1',
    type: 'aws',
    position: { x: 100, y: 260 },
    data: { icon: 'aws.ec2', title: 'EC2', subtitle: 'ASG', status: 'ok' },
  },
];
```

## Add a new icon
1. Create a React SVG component in `src/icons/aws/YourIcon.tsx` (inline SVG preferred).
2. Register it in `src/icons/index.ts`:
```ts
import { YourIcon } from './aws/YourIcon';
export type IconName = 'aws.alb' | 'aws.ec2' | 'aws.youricon';
iconRegistry['aws.youricon'] = YourIcon;
```

## Recommendations
- Prefer inline SVG for crisp scaling and theming.
- Keep icons minimal (single-color) and tint via `fill` when needed.
- Group VPC/Subnets using parent nodes (`extent="parent"`).
- For orthogonal edges, use `getSmoothStepPath` and custom markers.

## Roadmap
- Add more AWS icons (RDS, ElastiCache, S3, WAF, Route53, ACM, Secrets Manager).
- Create `AwsGroupNode` for VPC/Subnet containers.
- Provide a drag palette and ELK auto-layout action.

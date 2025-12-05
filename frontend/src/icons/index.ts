import React from 'react';
import { AwsAlbIcon } from './aws/Alb';
import { AwsEc2Icon } from './aws/Ec2';

export type IconName =
  | 'aws.alb'
  | 'aws.ec2';

export const iconRegistry: Record<IconName, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  'aws.alb': AwsAlbIcon,
  'aws.ec2': AwsEc2Icon,
};

export function getIconComponent(name: IconName) {
  return iconRegistry[name];
}


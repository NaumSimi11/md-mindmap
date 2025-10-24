import React from 'react';

export function AwsEc2Icon(props: React.SVGProps<SVGSVGElement>) {
  const { width = 28, height = 28, fill = 'currentColor', ...rest } = props;
  return (
    <svg viewBox="0 0 64 64" width={width} height={height} {...rest}>
      <rect x="12" y="12" width="40" height="40" rx="6" ry="6" fill="none" stroke={fill} strokeWidth="3" />
      <rect x="20" y="20" width="24" height="24" rx="3" ry="3" fill={fill} />
    </svg>
  );
}

export default AwsEc2Icon;


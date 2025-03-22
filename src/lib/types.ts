// Types for bits-ui components
export type WithElementRef<T = HTMLElement> = {
  ref?: T | null;
};

export type WithoutChild<T> = Omit<T, 'children'>;

export type WithoutChildrenOrChild<T> = Omit<T, 'children' | 'child'>;

// Utility type for Portal props
export type PortalProps = {
  target?: HTMLElement | string;
};

// Utility type for Root props
export type RootProps = {
  asChild?: boolean;
};

// Utility type for Group Heading props
export type GroupHeadingProps = {
  asChild?: boolean;
};

// Utility type for Scroll Button props
export type ScrollButtonProps = {
  asChild?: boolean;
}; 
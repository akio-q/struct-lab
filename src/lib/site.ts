export const siteConfig = {
  name: "StructLab",
  description:
    "An interactive visual playground for arrays, stacks, queues, deques, and doubly linked lists.",
  links: {
    github: "https://github.com/akio-q/struct-lab",
  },
} as const;

export type SiteConfig = typeof siteConfig;

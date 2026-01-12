"use client"

import * as React from "react"
import {
  Beef,
  Users,
  Activity,
  CircleDot,
  Sprout,
  Trees,
  Building2,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

// This is sample data.
const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    {
      name: "Farm 1",
      logo: Sprout,
      plan: "Palabana",
    },
    {
      name: "Farm 2",
      logo: Trees,
      plan: "Chibombo",
    },
    {
      name: "Farm 3",
      logo: Building2,
      plan: "Mumbwa",
    },
  ],
  navMain: [
    {
      title: "Cattle",
      url: "/dashboard",
      icon: Beef,
      isActive: true,
      items: [
        {
          title: "Milk Production",
          url: "/dashboard/MilkProduction",
        },
        {
          title: "Herd Management",
          url: "/dashboard/HerdManagement",
        },
        {
          title: "Health Monitoring",
          url: "/dashboard/HealthManagement",
        },
        {
          title: "Feed Management",
          url: "/dashboard/FeedManagement",
        },
      ],
    },
    {
      title: "Goats",
      url: "#",
      icon: Activity,
      items: [
        {
          title: "Herd Management",
          url: "#",
        },
        {
          title: "Health Monitoring",
          url: "#",
        },
        {
          title: "Feed Management",
          url: "#",
        },
      ],
    },
    {
      title: "Sheep",
      url: "#",
      icon: CircleDot,
      items: [
        {
          title: "Flock Management",
          url: "#",
        },
        {
          title: "Health Monitoring",
          url: "#",
        },
        {
          title: "Feed Management",
          url: "#",
        },
      ],
    },
    {
      title: "Employees",
      url: "#",
      icon: Users,
      items: [
        {
          title: "Directory",
          url: "#",
        },
        {
          title: "Roles & Permissions",
          url: "#",
        },
        {
          title: "Payroll",
          url: "#",
        },
      ],
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

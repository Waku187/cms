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
      url: "/dashboard/Employees",
      icon: Users,
      items: [
        {
          title: "Directory",
          url: "/dashboard/Employees",
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
  const [user, setUser] = React.useState({
    name: "User",
    email: "",
    avatar: "",
    role: "WORKER",
  })

  React.useEffect(() => {
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setUser({
            name: data.user.name,
            email: data.user.email,
            avatar: "", // Add avatar logic if needed
            role: data.user.role,
          })
        }
      })
      .catch((err) => console.error("Failed to fetch session:", err))
  }, [])

  // Filter menu items based on user role
  const filteredNavMain = data.navMain.filter(item => {
    if (item.title === "Employees") {
      return user.role === "ADMIN";
    }
    return true;
  });

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={filteredNavMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}



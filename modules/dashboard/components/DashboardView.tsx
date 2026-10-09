"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { useEffect, useState } from "react";
import { getProjects } from "@/modules/projects/services/projectService";
import type { Project } from "@/modules/projects/types/project";



export function DashboardView() {
  const [projects, setProjects] = useState<Project[]>([]);

const dashboardStats = [
  {
    title: "Total Projects",
    value: projects.length,
  },
  {
    title: "Published",
    value: projects.filter(
      (project) => project.status === "published",
    ).length,
  },
  {
    title: "Draft",
    value: projects.filter(
      (project) => project.status === "draft",
    ).length,
  },
  {
    title: "Expiring Soon",
    value: projects.filter((project) => {
      if (!project.expires_at) {
        return false;
      }

      const now = new Date();
      const warningDate = new Date();
      warningDate.setDate(warningDate.getDate() + 30);

      const expiryDate = new Date(project.expires_at);

      return (
        project.status === "published" &&
        expiryDate >= now &&
        expiryDate <= warningDate
      );
    }).length,
  },
];



  useEffect(() => {
    async function loadProjects() {
      const data = await getProjects();
      setProjects(data);
    }

    loadProjects();
  }, []);


  return (
    <div className="p-8">
      <div>
        <h2 className="text-2xl font-bold">
          Dashboard
        </h2>

        <p className="mt-1 text-sm text-muted-foreground">
          Overview of your AR projects and experiences.
        </p>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {dashboardStats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
            </CardHeader>

            <CardContent>
              <p className="text-3xl font-bold">
                {stat.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
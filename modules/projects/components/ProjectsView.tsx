"use client";

import { useEffect, useState } from "react";
import { getProjects } from "../services/projectService";
import type { Project } from "../types/project";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function ProjectsView() {
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    async function loadProjects() {
      const data = await getProjects();

      setProjects(data);
    }

    loadProjects();
  }, []);

  return (
    <div>
      <div>
        <h2 className="text-lg font-semibold">
          Project List
        </h2>

        <p className="mt-1 text-sm text-muted-foreground">
          Your AR projects will appear here.
        </p>
      </div>

      <div className="mt-6 rounded-lg border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="text-right">
                Action
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {projects.map((project) => (
              <TableRow key={project.id}>
                <TableCell className="font-medium">
                  {project.name}
                </TableCell>

                <TableCell>
                  {project.slug}
                </TableCell>

                <TableCell>
                  {project.status}
                </TableCell>

                <TableCell>
                  {new Date(
                    project.updated_at,
                  ).toLocaleDateString("id-ID")}
                </TableCell>

                <TableCell className="text-right">
                  <Link
                    href={`/dashboard/projects/${project.id}`}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    Open
                  </Link>
              </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
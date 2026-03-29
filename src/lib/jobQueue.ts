import { logger } from "./logger";
import type { Job, JobStatus } from "./types";

const jobs = new Map<string, Job>();

export function enqueue(job: Job): void {
  jobs.set(job.jobId, job);
  logger.debug({ jobId: job.jobId, siteId: job.siteId }, "Job enqueued");
}

export function stop(jobId: string): void {
  const job = jobs.get(jobId);
  if (job && (job.status === "pending" || job.status === "running")) {
    job.controller.abort();
    job.status = "stopped";
    logger.info({ jobId }, "Job stopped");
  }
}

export function stopAll(): void {
  for (const [id] of jobs) stop(id);
}

export function setStatus(jobId: string, status: JobStatus, error?: string): void {
  const job = jobs.get(jobId);
  if (job) {
    job.status = status;
    if (error) job.error = error;
  }
}

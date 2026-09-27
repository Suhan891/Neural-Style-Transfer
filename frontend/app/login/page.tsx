"use client";

import { useState, type FormEvent } from "react";
import { ArrowRight, Layers3, LoaderCircle, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const API_BASE_URL = (
	process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
).replace(/\/+$/, "");

function getAccessToken(payload: unknown): string | null {
	if (typeof payload === "string") return payload.trim() || null;
	if (!payload || typeof payload !== "object") return null;

	const record = payload as Record<string, unknown>;
	const token = record.access_token ?? record.token;
	return typeof token === "string" ? token.trim() || null : null;
}

function getErrorMessage(payload: unknown): string | null {
	if (!payload || typeof payload !== "object") return null;
	const record = payload as Record<string, unknown>;
	if (typeof record.detail === "string") return record.detail;
	if (typeof record.message === "string") return record.message;
	return null;
}

export default function LoginPage() {
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setIsSubmitting(true);
		setError(null);

		try {
			const response = await fetch(`${API_BASE_URL}/user/login`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ name: name.trim(), email: email.trim() }),
			});

			const payload: unknown = await response.json().catch(() => null);
			if (!response.ok) {
				throw new Error(
					getErrorMessage(payload) ?? `Sign in failed (${response.status}).`,
				);
			}

			const token = getAccessToken(payload);
			if (!token) {
				throw new Error("The server did not return an access token.");
			}

			const sessionResponse = await fetch("/api/session", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ token }),
			});
			if (!sessionResponse.ok) {
				throw new Error("Could not start a secure session. Please try again.");
			}

			const requestedPath = new URLSearchParams(window.location.search).get("next");
			const nextPath =
				requestedPath?.startsWith("/") &&
				!requestedPath.startsWith("//") &&
				!requestedPath.includes("\\")
					? requestedPath
					: "/";
			window.location.replace(nextPath);
		} catch (caught) {
			setError(
				caught instanceof Error
					? caught.message
					: "Could not sign in. Check your connection and try again.",
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<main className="relative grid min-h-screen place-items-center overflow-hidden bg-[#f1f2e9] px-4 py-10 text-[#203d31]">
			<div
				aria-hidden="true"
				className="pointer-events-none absolute inset-0 opacity-60"
				style={{
					backgroundImage:
						"linear-gradient(to right, rgba(47, 83, 61, 0.045) 1px, transparent 1px), linear-gradient(to bottom, rgba(47, 83, 61, 0.045) 1px, transparent 1px)",
					backgroundSize: "56px 56px",
				}}
			/>

			<div className="relative w-full max-w-md">
				<div className="mb-6 flex items-center justify-center gap-3">
					<span className="grid size-11 place-items-center rounded-xl bg-[#264b38] text-[#f8f5e9] shadow-sm">
						<Layers3 className="size-5" aria-hidden="true" />
					</span>
					<div>
						<p className="text-sm font-semibold">MORPH</p>
						<p className="text-xs text-[#768278]">Neural image studio</p>
					</div>
				</div>

				<Card className="border-[#dce2d8] bg-[#fffefa]/95 shadow-[0_24px_70px_-38px_rgba(29,62,48,0.42)]">
					<CardHeader className="space-y-3 pb-5">
						<Badge
							variant="outline"
							className="w-fit gap-1.5 border-[#d8e1d7] bg-[#f3f6ef] text-[#496551]"
						>
							<ShieldCheck className="size-3" aria-hidden="true" />
							Secure access
						</Badge>
						<div className="space-y-1.5">
							<CardTitle className="text-2xl font-semibold text-[#203d31]">
								Sign in to your studio
							</CardTitle>
							<CardDescription className="text-sm text-[#728077]">
								Continue with your name and email address.
							</CardDescription>
						</div>
					</CardHeader>

					<form onSubmit={handleSubmit}>
						<CardContent className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="name">Name</Label>
								<Input
									id="name"
									name="name"
									autoComplete="name"
									minLength={3}
									maxLength={50}
									placeholder="Your name"
									value={name}
									onChange={(event) => setName(event.target.value)}
									required
									disabled={isSubmitting}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="email">Email address</Label>
								<Input
									id="email"
									name="email"
									type="email"
									autoComplete="email"
									placeholder="you@example.com"
									value={email}
									onChange={(event) => setEmail(event.target.value)}
									required
									disabled={isSubmitting}
								/>
							</div>
							{error && (
								<p
									role="alert"
									className="rounded-md border border-[#e2b6a8] bg-[#fbede7] px-3 py-2 text-sm text-[#894631]"
								>
									{error}
								</p>
							)}
							<Button
								type="submit"
								className="h-10 w-full gap-2"
								disabled={isSubmitting || !name.trim() || !email.trim()}
							>
								{isSubmitting ? (
									<LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
								) : (
									<ArrowRight className="size-4" aria-hidden="true" />
								)}
								{isSubmitting ? "Signing in…" : "Continue"}
							</Button>
						</CardContent>
					</form>
				</Card>
			</div>
		</main>
	);
}

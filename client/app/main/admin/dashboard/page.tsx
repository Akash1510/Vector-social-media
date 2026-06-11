"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useAppContext } from "@/context/AppContext";
import GlobalLoader from "@/components/GlobalLoader";
import { toast } from "react-toastify";
import Link from "next/link";
import { Post, Comment, UserSummary } from "@/lib/types";

type FlaggedData = {
    posts: Post[];
    comments: Comment[];
};

export default function AdminDashboard() {
    const { userData, loading } = useAppContext();
    const router = useRouter();
    const [data, setData] = useState<FlaggedData>({ posts: [], comments: [] });
    const [fetching, setFetching] = useState(true);

    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

    useEffect(() => {
        if (!loading && userData && userData.role !== "admin") {
            router.replace("/main");
        }
    }, [loading, userData, router]);

    useEffect(() => {
        if (userData?.role === "admin") {
            fetchFlaggedContent();
        }
    }, [userData]);

    const fetchFlaggedContent = async () => {
        try {
            const res = await axios.get(`${BACKEND_URL}/api/admin/flagged`, { withCredentials: true });
            setData(res.data.data);
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to load flagged content");
        } finally {
            setFetching(false);
        }
    };

    const handleDismiss = async (type: "post" | "comment", id: string) => {
        try {
            await axios.patch(`${BACKEND_URL}/api/admin/dismiss/${type}/${id}`, {}, { withCredentials: true });
            toast.success("Flag dismissed");
            setData((prev) => ({
                ...prev,
                [type + "s"]: prev[(type + "s") as keyof FlaggedData].filter((item) => item._id !== id)
            }));
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to dismiss flag");
        }
    };

    const handleDelete = async (type: "post" | "comment", id: string) => {
        if (!confirm(`Are you sure you want to delete this ${type}?`)) return;
        try {
            await axios.delete(`${BACKEND_URL}/api/admin/${type}/${id}`, { withCredentials: true });
            toast.success("Content deleted");
            setData((prev) => ({
                ...prev,
                [type + "s"]: prev[(type + "s") as keyof FlaggedData].filter((item) => item._id !== id)
            }));
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to delete content");
        }
    };

    const handleBan = async (userId: string) => {
        if (!confirm("Are you sure you want to toggle ban for this user?")) return;
        try {
            const res = await axios.patch(`${BACKEND_URL}/api/admin/user/${userId}/ban`, {}, { withCredentials: true });
            toast.success(res.data.message);
            // We do not remove the posts/comments on ban automatically in this simple view,
            // but the user's status will reflect as banned internally.
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to ban user");
        }
    };

    if (loading || fetching) return <GlobalLoader />;
    if (userData?.role !== "admin") return null;

    return (
        <div className="p-4 md:p-8 max-w-5xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Admin Moderation Dashboard</h1>
            
            <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4 text-red-500">Flagged Posts ({data.posts.length})</h2>
                {data.posts.length === 0 ? (
                    <p className="text-gray-500">No flagged posts found.</p>
                ) : (
                    <div className="space-y-4">
                        {data.posts.map((post) => (
                            <div key={post._id} className="p-4 border rounded shadow-sm bg-white dark:bg-gray-800">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-medium text-sm text-gray-500">Post ID: {post._id}</p>
                                        <p className="mt-2 text-lg">{post.content}</p>
                                        <div className="mt-2 text-sm text-gray-400">
                                            Author: <Link href={`/main/profile/${(post.author as UserSummary).username}`} className="text-blue-500">@{(post.author as UserSummary).username}</Link>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleDismiss("post", post._id)} className="px-3 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 text-sm">Dismiss</button>
                                        <button onClick={() => handleDelete("post", post._id)} className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm">Delete</button>
                                        <button onClick={() => handleBan((post.author as UserSummary)._id)} className="px-3 py-1 bg-orange-500 text-white rounded hover:bg-orange-600 text-sm">Ban User</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div>
                <h2 className="text-xl font-semibold mb-4 text-red-500">Flagged Comments ({data.comments.length})</h2>
                {data.comments.length === 0 ? (
                    <p className="text-gray-500">No flagged comments found.</p>
                ) : (
                    <div className="space-y-4">
                        {data.comments.map((comment) => (
                            <div key={comment._id} className="p-4 border rounded shadow-sm bg-white dark:bg-gray-800">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-medium text-sm text-gray-500">Comment ID: {comment._id}</p>
                                        <p className="mt-2 text-lg">{comment.content}</p>
                                        <div className="mt-2 text-sm text-gray-400">
                                            Author: <Link href={`/main/profile/${comment.author?.username}`} className="text-blue-500">@{comment.author?.username}</Link>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleDismiss("comment", comment._id)} className="px-3 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 text-sm">Dismiss</button>
                                        <button onClick={() => handleDelete("comment", comment._id)} className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm">Delete</button>
                                        <button onClick={() => comment.author?._id && handleBan(comment.author._id)} className="px-3 py-1 bg-orange-500 text-white rounded hover:bg-orange-600 text-sm">Ban User</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

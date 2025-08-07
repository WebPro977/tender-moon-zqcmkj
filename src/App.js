import React, { useState, useEffect, useCallback } from "react";

// Import Firebase modules
// Make sure to install firebase: npm install firebase
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  createUserWithEmailAndPassword, // Keep for first-time setup if needed
} from "firebase/auth";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
  getDoc,
  where,
} from "firebase/firestore";

// --- !!! IMPORTANT: PASTE YOUR FIREBASE CONFIG HERE !!! ---
const firebaseConfig = {
  apiKey: "AIzaSyBr1ZPsq3ySyDd7T0qduFmIgm3IAGDWjw0",
  authDomain: "healingessentialsblog.firebaseapp.com",
  projectId: "healingessentialsblog",
  storageBucket: "healingessentialsblog.appspot.com",
  messagingSenderId: "123299536755",
  appId: "1:123299536755:web:c8cadfe90b233c260f2f06",
  measurementId: "G-LH2SZ6YC64",
};
// ---------------------------------------------------------

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

// --- HELPER FUNCTION ---
// Function to create SEO-friendly slugs from titles
const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/[^\w\-]+/g, "") // Remove all non-word chars
    .replace(/\-\-+/g, "-"); // Replace multiple - with single -
};

// --- REACT COMPONENTS ---

// 1. ADMIN LOGIN COMPONENT
const AdminLogin = ({ setUser }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // The onAuthStateChanged listener will handle setting the user state
    } catch (err) {
      setError("Failed to log in. Please check your email and password.");
      console.error("Login Error:", err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
          Admin Login
        </h2>
        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="email"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>
          <div className="mb-6">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="password"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>
          {error && <p className="text-red-500 text-xs italic mb-4">{error}</p>}
          <div className="flex items-center justify-between">
            <button
              type="submit"
              className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              Sign In
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// 2. ADMIN PANEL COMPONENT
const AdminPanel = ({ user }) => {
  const [posts, setPosts] = useState([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [author, setAuthor] = useState("Cynthia Maguire"); // Default author
  const [imageUrl, setImageUrl] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [editingPost, setEditingPost] = useState(null); // To hold the post being edited

  const fetchPosts = useCallback(async () => {
    const postsCollection = collection(db, "posts");
    const q = query(postsCollection, orderBy("createdAt", "desc"));
    const postSnapshot = await getDocs(q);
    const postList = postSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setPosts(postList);
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleLogout = async () => {
    await signOut(auth);
  };

  const clearForm = () => {
    setTitle("");
    setContent("");
    setAuthor("Cynthia Maguire");
    setImageUrl("");
    setMetaDescription("");
    setEditingPost(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !content || !author || !metaDescription) {
      alert("Please fill out all fields.");
      return;
    }

    const slug = slugify(title);

    if (editingPost) {
      // Update existing post
      const postRef = doc(db, "posts", editingPost.id);
      await updateDoc(postRef, {
        title,
        content,
        author,
        imageUrl,
        metaDescription,
        slug,
        updatedAt: new Date(),
      });
    } else {
      // Create new post
      await addDoc(collection(db, "posts"), {
        title,
        content,
        author,
        imageUrl,
        metaDescription,
        slug,
        createdAt: new Date(),
      });
    }

    clearForm();
    await fetchPosts(); // Refresh the list
  };

  const handleEdit = (post) => {
    setEditingPost(post);
    setTitle(post.title);
    setContent(post.content);
    setAuthor(post.author);
    setImageUrl(post.imageUrl || "");
    setMetaDescription(post.metaDescription || "");
    window.scrollTo(0, 0); // Scroll to top to see the form
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this post?")) {
      await deleteDoc(doc(db, "posts", id));
      await fetchPosts(); // Refresh the list
    }
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Admin Panel</h1>
        <button
          onClick={handleLogout}
          className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded"
        >
          Logout
        </button>
      </div>

      {/* Form for Creating/Editing Posts */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-2xl font-bold mb-4">
          {editingPost ? "Edit Post" : "Create New Post"}
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 font-bold mb-2">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 font-bold mb-2">
              Content (Markdown is supported)
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full p-2 border rounded"
              rows="10"
              required
            ></textarea>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-gray-700 font-bold mb-2">
                Author
              </label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 font-bold mb-2">
                Image URL (Optional)
              </label>
              <input
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="w-full p-2 border rounded"
              />
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 font-bold mb-2">
              Meta Description (For SEO - ~155 characters)
            </label>
            <input
              type="text"
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              className="w-full p-2 border rounded"
              maxLength="160"
              required
            />
          </div>
          <div className="flex items-center">
            <button
              type="submit"
              className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded"
            >
              {editingPost ? "Update Post" : "Publish Post"}
            </button>
            {editingPost && (
              <button
                type="button"
                onClick={clearForm}
                className="ml-4 bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded"
              >
                Cancel Edit
              </button>
            )}
          </div>
        </form>
      </div>

      {/* List of Existing Posts */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4">Existing Posts</h2>
        <div className="space-y-4">
          {posts.map((post) => (
            <div
              key={post.id}
              className="flex justify-between items-center p-4 border rounded"
            >
              <div>
                <h3 className="font-bold">{post.title}</h3>
                <p className="text-sm text-gray-500">
                  Published on:{" "}
                  {new Date(post.createdAt.seconds * 1000).toLocaleDateString()}
                </p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(post)}
                  className="bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded text-sm"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(post.id)}
                  className="bg-red-500 hover:bg-red-600 text-white py-1 px-3 rounded text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// 3. BLOG LIST COMPONENT (Public)
const BlogList = ({ setRoute }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      const postsCollection = collection(db, "posts");
      const q = query(postsCollection, orderBy("createdAt", "desc"));
      const postSnapshot = await getDocs(q);
      const postList = postSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPosts(postList);
      setLoading(false);
    };
    fetchPosts();
  }, []);

  useEffect(() => {
    document.title = "Blog | Healing Essentials Guide";
    // You can also set a default meta description for the blog list page
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute(
        "content",
        "Explore articles on natural wellness, holistic healing, and naturopathic care from the Healing Essentials team."
      );
    }
  }, []);

  if (loading) {
    return <div className="text-center p-10">Loading posts...</div>;
  }

  return (
    <div className="bg-gray-50">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-teal-700 mb-2">
            Healing Essentials Blog
          </h1>
          <p className="text-lg text-gray-600">
            Insights on Natural Wellness and Holistic Health
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((post) => (
            <div
              key={post.id}
              className="bg-white rounded-lg shadow-md overflow-hidden transform hover:-translate-y-1 transition-transform duration-300"
            >
              {post.imageUrl && (
                <img
                  src={post.imageUrl}
                  alt={post.title}
                  className="w-full h-48 object-cover"
                />
              )}
              <div className="p-6">
                <h2 className="text-xl font-bold mb-2 text-gray-800">
                  {post.title}
                </h2>
                <p className="text-sm text-gray-500 mb-2">
                  By {post.author} on{" "}
                  {new Date(post.createdAt.seconds * 1000).toLocaleDateString()}
                </p>
                <p className="text-gray-700 mb-4">{post.metaDescription}</p>
                <button
                  onClick={() => setRoute(`/blog/${post.slug}`)}
                  className="text-teal-600 hover:text-teal-800 font-semibold"
                >
                  Read More &rarr;
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// 4. SINGLE BLOG POST COMPONENT (Public)
const BlogPost = ({ slug, setRoute }) => {
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      setLoading(true);
      const postsCollection = collection(db, "posts");
      const q = query(postsCollection, where("slug", "==", slug), limit(1));
      const postSnapshot = await getDocs(q);

      if (!postSnapshot.empty) {
        const postData = {
          id: postSnapshot.docs[0].id,
          ...postSnapshot.docs[0].data(),
        };
        setPost(postData);
        // SEO: Update title and meta description
        document.title = `${postData.title} | Healing Essentials Blog`;
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) {
          metaDesc.setAttribute("content", postData.metaDescription);
        }
      } else {
        console.error("No such document!");
      }
      setLoading(false);
    };

    if (slug) {
      fetchPost();
    }
  }, [slug]);

  // A simple markdown to HTML converter
  const renderMarkdown = (text) => {
    // This is a very basic renderer. For a full blog, consider a library like 'marked' or 'react-markdown'.
    return text
      .replace(
        /^### (.*$)/gim,
        '<h3 class="text-xl font-bold mt-6 mb-2">$1</h3>'
      )
      .replace(
        /^## (.*$)/gim,
        '<h2 class="text-2xl font-bold mt-8 mb-4">$1</h2>'
      )
      .replace(
        /^# (.*$)/gim,
        '<h1 class="text-3xl font-bold mt-8 mb-4">$1</h1>'
      )
      .replace(/\*\*(.*)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*)\*/g, "<em>$1</em>")
      .replace(/\n/g, "<br />");
  };

  if (loading) {
    return <div className="text-center p-10">Loading post...</div>;
  }

  if (!post) {
    return <div className="text-center p-10">Post not found.</div>;
  }

  return (
    <div className="bg-white">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="max-w-3xl mx-auto">
          <button
            onClick={() => setRoute("/blog")}
            className="text-teal-600 hover:text-teal-800 mb-8"
          >
            &larr; Back to Blog
          </button>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            {post.title}
          </h1>
          <p className="text-gray-500 mb-4">
            By {post.author} on{" "}
            {new Date(post.createdAt.seconds * 1000).toLocaleDateString()}
          </p>
          {post.imageUrl && (
            <img
              src={post.imageUrl}
              alt={post.title}
              className="w-full rounded-lg shadow-lg mb-8"
            />
          )}
          <div
            className="prose lg:prose-xl max-w-none"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(post.content) }}
          ></div>
        </div>
      </div>
    </div>
  );
};

// 5. MAIN APP COMPONENT (Handles Routing)
export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  // Simple routing based on URL path
  const [route, setRoute] = useState(window.location.pathname);

  useEffect(() => {
    // Firebase auth state listener
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe(); // Cleanup on unmount
  }, []);

  // Handle browser back/forward navigation
  useEffect(() => {
    const handlePopState = () => setRoute(window.location.pathname);
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Custom navigation function
  const navigate = (path) => {
    window.history.pushState({}, "", path);
    setRoute(path);
  };

  if (loading) {
    return <div>Loading...</div>; // Or a proper loading spinner
  }

  // --- ROUTING LOGIC ---
  if (route.startsWith("/admin")) {
    return user ? <AdminPanel user={user} /> : <AdminLogin setUser={setUser} />;
  }

  if (route.startsWith("/blog/")) {
    const slug = route.substring("/blog/".length);
    return <BlogPost slug={slug} setRoute={navigate} />;
  }

  // Default to blog list
  return <BlogList setRoute={navigate} />;
}

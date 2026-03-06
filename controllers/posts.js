const cloudinary = require("../middleware/cloudinary");
const Post = require("../models/Post");
const Comment = require("../models/Comment")

module.exports = {
  getProfile: async (req, res) => {
    try {
      // Mongoose 9: find() still returns a Query; await to resolve
      const posts = await Post.find({ user: req.user.id });
      res.render("profile.ejs", { posts: posts, user: req.user });
    } catch (err) {
      console.error("Error fetching profile:", err);
      res.status(500).send("Internal Server Error");
    }
  },

  getFeed: async (req, res) => {
    try {
      const posts = await Post.find().sort({ createdAt: "desc" }).lean();
      res.render("feed.ejs", { posts: posts });
    } catch (err) {
      console.error("Error fetching feed:", err);
    }
  },

  getPost: async (req, res) => {
    try {
      const post = await Post.findById(req.params.id);
      const comments = await Comment.find({ post: req.params.id }).sort({ createdAt: "asc" }).lean();
      res.render("post.ejs", { post: post, user: req.user, comments: comments });
    } catch (err) {
      console.error("Error fetching post:", err);
    }
  },

  createPost: async (req, res) => {
    try {
      const result = await cloudinary.uploader.upload(req.file.path);

      await Post.create({
        title: req.body.title,
        image: result.secure_url,
        cloudinaryId: result.public_id,
        caption: req.body.caption,
        likes: 0,
        user: req.user.id,
      });
      console.log("Post has been added!");
      res.redirect("/profile");
    } catch (err) {
      console.error("Error creating post:", err);
    }
  },

  likePost: async (req, res) => {
    try {
      // findOneAndUpdate is still preferred in v9 for atomic increments
      await Post.findOneAndUpdate(
        { _id: req.params.id },
        { $inc: { likes: 1 } }
      );
      console.log("Likes +1");
      res.redirect(`/post/${req.params.id}`);
    } catch (err) {
      console.error("Error liking post:", err);
    }
  },

  deletePost: async (req, res) => {
    try {
      // 1. Find post to get Cloudinary ID
      const post = await Post.findById(req.params.id);

      if (!post) {
        return res.redirect("/profile");
      }

      // 2. Delete image from cloudinary
      await cloudinary.uploader.destroy(post.cloudinaryId);

      // 3. Delete from DB (Mongoose 9 Fix)
      // .remove() was removed in Mongoose 7/8. Use deleteOne() instead.
      await Post.deleteOne({ _id: req.params.id });

      console.log("Deleted Post");
      res.redirect("/profile");
    } catch (err) {
      console.error("Error deleting post:", err);
      res.redirect("/profile");
    }
  },
};
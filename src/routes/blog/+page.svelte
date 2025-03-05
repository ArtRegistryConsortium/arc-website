<script lang="ts">
  import { Button } from "$lib/components/ui/button/index.js";
  
  // Blog data - in a real application, this would come from a database or API
  const blogs = [
    {
      id: 2,
      title: "ART: The New Certificate of Authenticity / Digital COA",
      slug: "art-new-certificate-of-authenticity",
      excerpt: "For centuries, the Certificate of Authenticity (COA) has been the cornerstone of proving an artwork's legitimacy. But as the art world grows increasingly digital and global, this antiquated system is proving insufficient. Enter ART (Artwork Registry Token)—a blockchain-based evolution of the COA.",
      date: "May 15, 2023",
      author: "ARC Team"
    },
    {
      id: 1,
      title: "The Problem with Art Documentation: Closed, Confusing, and Exclusive",
      slug: "problem-with-art-documentation",
      excerpt: "Art documentation has long been a fractured, opaque, and often inaccessible system. In a world where provenance determines value, credibility, and authenticity, the art world remains burdened by outdated methods that favor exclusivity over transparency.",
      date: "May 5, 2023",
      author: "ARC Team"
    }
    // More blogs can be added here in the future
  ];
</script>

<div class="container mx-auto px-4 max-w-4xl md:pb-10">
  <section class="md:mb-12 pt-12 md:pt-20">
    <div class="mb-10 md:mb-16">
      <h1 class="text-3xl md:text-5xl font-extrabold mb-6 leading-tight">ARC Blog</h1>
      <p class="text-lg md:text-xl max-w-4xl mx-auto text-muted-foreground">
        Insights, updates, and perspectives on art provenance and the future of art documentation.
      </p>
    </div>

    <div class="grid gap-8">
      {#each blogs as blog}
        <div class="bg-muted rounded-lg hover:shadow-md transition-all duration-300">
          <div class="p-6 md:p-8">
            <div class="flex items-center mb-4 text-sm text-muted-foreground">
              <span class="inline-block bg-primary/10 text-primary px-3 py-1 rounded-full">{blog.date}</span>
              <span class="mx-2">•</span>
              <span>{blog.author}</span>
            </div>
            
            <h2 class="text-xl md:text-2xl font-bold mb-3 hover:text-primary transition-colors">
              <a href={`/blog/${blog.slug}`} class="hover:underline underline-offset-4">{blog.title}</a>
            </h2>
            
            <p class="mb-6 text-muted-foreground">{blog.excerpt}</p>
            
            <Button variant="outline" class="group">
              <a href={`/blog/${blog.slug}`} class="flex items-center">
                Read More
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </a>
            </Button>
          </div>
        </div>
      {/each}
    </div>
  </section>
</div> 
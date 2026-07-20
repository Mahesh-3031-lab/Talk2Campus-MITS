import { Helmet } from "react-helmet-async";

interface SEOHeadProps {
  title?: string;
  description?: string;
  path?: string;
  image?: string;
  type?: string;
}

const BASE_URL = "https://talk2campus.lovable.app";
const DEFAULT_IMAGE = `${BASE_URL}/og-image.png`;
const SITE_NAME = "Talk2Campus – MITS";

const SEOHead = ({
  title = "Talk2Campus – MITS | AI Campus Companion",
  description = "Talk2Campus – Your AI-powered campus companion at Madanapalle Institute of Technology and Science (MITS). Navigate campus, track attendance, order food, and get instant answers.",
  path = "/",
  image = DEFAULT_IMAGE,
  type = "website",
}: SEOHeadProps) => {
  const url = `${BASE_URL}${path}`;

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />

      {/* Open Graph */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={image} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={SITE_NAME} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* JSON-LD structured data */}
      {path === "/" && (
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: "Talk2Campus",
            url: BASE_URL,
            description,
            applicationCategory: "EducationalApplication",
            operatingSystem: "Web",
            offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
            author: {
              "@type": "Organization",
              name: "Madanapalle Institute of Technology and Science",
              url: "https://mfrits.ac.in",
              address: {
                "@type": "PostalAddress",
                addressLocality: "Madanapalle",
                addressRegion: "Andhra Pradesh",
                addressCountry: "IN",
              },
            },
          })}
        </script>
      )}
    </Helmet>
  );
};

export default SEOHead;

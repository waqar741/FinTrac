import { Helmet } from 'react-helmet-async';

interface SEOProps {
    title: string;
    description?: string;
    type?: string;
    name?: string;
}

export default function SEO({
    title,
    description = "Traxos - Track your expenses with ease",
    type = 'website',
    name = 'Traxos',
    canonical,
    image = '/online-ai-dark.png'
}: SEOProps & { canonical?: string; image?: string }) {
    const siteUrl = 'https://traxos.vercel.app';
    const fullImage = image.startsWith('http') ? image : `${siteUrl}${image}`;
    const fullUrl = canonical ? (canonical.startsWith('http') ? canonical : `${siteUrl}${canonical}`) : siteUrl;

    const schema = {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": "Traxos",
        "applicationCategory": "FinanceApplication",
        "operatingSystem": "Web",
        "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "INR"
        },
        "sameAs": [
            "https://github.com/waqar741/Traxos",
            "https://linkedin.com/in/shaikh-waquar"
        ]
    };

    return (
        <Helmet>
            {/* Standard metadata tags */}
            <title>{title} | Traxos</title>
            <meta name='description' content={description} />
            <link rel="canonical" href={fullUrl} />

            {/* Facebook tags */}
            <meta property="og:type" content={type} />
            <meta property="og:title" content={title} />
            <meta property="og:description" content={description} />
            <meta property="og:image" content={fullImage} />
            <meta property="og:url" content={fullUrl} />

            {/* Twitter tags */}
            <meta name="twitter:creator" content={name} />
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={title} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image" content={fullImage} />

            {/* Schema.org */}
            <script type="application/ld+json">
                {JSON.stringify(schema)}
            </script>
        </Helmet>
    );
}

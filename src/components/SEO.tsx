import { Helmet } from 'react-helmet-async';

interface SEOProps {
    title: string;
    description?: string;
    type?: string;
    name?: string;
}

export default function SEO({
    title,
    description = "FinTrac - Track your expenses with ease",
    type = 'website',
    name = 'FinTrac'
}: SEOProps) {
    return (
        <Helmet>
            {/* Standard metadata tags */}
            <title>{title} | FinTrac</title>
            <meta name='description' content={description} />

            {/* Facebook tags */}
            <meta property="og:type" content={type} />
            <meta property="og:title" content={title} />
            <meta property="og:description" content={description} />

            {/* Twitter tags */}
            <meta name="twitter:creator" content={name} />
            <meta name="twitter:card" content={type} />
            <meta name="twitter:title" content={title} />
            <meta name="twitter:description" content={description} />
        </Helmet>
    );
}

import { Helmet } from 'react-helmet-async';

const SEO = ({
    title,
    description,
    name = 'MetaBench',
    type = 'website',
    keywords,
    image = '/og-image.png',
    url = window.location.href
}) => {
    const fullTitle = title ? `${title} | ${name}` : name;
    const defaultDescription = description || 'Compare and analyze the latest Large Language Models (LLMs) with MetaBench, the LLM Metacritic.';

    return (
        <Helmet>
            {/* Standard metadata tags */}
            <title>{fullTitle}</title>
            <meta name='description' content={defaultDescription} />
            {keywords && <meta name='keywords' content={keywords} />}

            {/* Open Graph / Facebook */}
            <meta property="og:type" content={type} />
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={defaultDescription} />
            <meta property="og:image" content={image} />
            <meta property="og:url" content={url} />

            {/* Twitter */}
            <meta name="twitter:creator" content={name} />
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={fullTitle} />
            <meta name="twitter:description" content={defaultDescription} />
            <meta name="twitter:image" content={image} />
        </Helmet>
    );
};

export default SEO;

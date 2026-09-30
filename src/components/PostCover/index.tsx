import { type CSSProperties, useEffect, useRef, useState } from 'react';

import './index.css';

type Props = {
	alt: string;
	img?: Post['img'];
	className?: string;
	viewTransitionName: string;
};

export default function PostCover({
	alt,
	img,
	className,
	viewTransitionName,
}: Props) {
	const imgRef = useRef<HTMLImageElement>(null);
	const [loaded, setLoaded] = useState(false);

	// 图片可能在水合之前就已加载完成，这种情况下 load 事件不会再触发
	useEffect(() => {
		if (imgRef.current?.complete) setLoaded(true);
	}, []);

    if (!img) return null;

	return (
		<div
			className={`post-cover${className ? ` ${className}` : ''}`}
			style={
				{
					viewTransitionName,
					'--cover-ph': img.placeholder
						? `url('${img.placeholder}')`
						: undefined,
				} as CSSProperties
			}
		>
			<img
				ref={imgRef}
				alt={alt}
				src={img.src}
				sizes={img.sizes}
				srcSet={img.srcset}
				width={img.width}
				height={img.height}
				onLoad={() => setLoaded(true)}
				className={loaded ? 'loaded' : ''}
			/>
		</div>
	);
}

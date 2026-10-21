import { IconAndElement } from '../../../common/components/IconAndElement'
import style from '../style/NewsArticle.module.scss'
import { Image } from '../../../common/components/Image'
import { NewsArticleHeaderProps } from '../types/NewsArticles.type'

/**
 * Renders news article with a title, image and category
 */
function NewsArticleHeader({
  title,
  imageUrl,
  category,
  fallbackContent,
}: NewsArticleHeaderProps) {
  return (
    <header className={style['news-article__header']}>
      <div className={style['news-article__img-title']}>
        <h2 className={style['news-article__title']}>{title}</h2>
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={title}
            className={style['news-article__image']}
          />
        ) : null}
      </div>

      <IconAndElement icon={'category'}>
        <p className={style['news-article__category']}>
          {category ?? fallbackContent}
        </p>
      </IconAndElement>
    </header>
  )
}

export { NewsArticleHeader }

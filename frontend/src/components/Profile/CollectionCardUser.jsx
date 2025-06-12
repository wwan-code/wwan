// src/components/Profile/CollectionCardUser.jsx
import React, { useState } from 'react';
import { Link } from "react-router-dom";
import { toast } from 'react-toastify';
import classNames from '@utils/classNames';
import SingleFilmHorizontal from '@components/Common/SingleFilmHorizontal';
import SingleComicHorizontal from '@components/Common/SingleComicHorizontal';

import '@assets/scss/components/_collection-card-user.scss';

const CollectionCardUser = React.memo(({ collection, onRemoveItem, onDeleteCollection, onEditCollection }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    if (!collection) return null;

    const typeLabel = collection.type === 'movie' ? 'Phim' : collection.type === 'comic' ? 'Truyện' : 'Khác';
    const items = collection.type === 'movie' ? collection.movies : collection.type === 'comic' ? collection.comics : [];
    const itemCount = items?.length || 0;

    const copyShareLink = (e) => {
        e.stopPropagation(); // Ngăn sự kiện click của card header làm toggle accordion
        if (collection.slug) {
            navigator.clipboard.writeText(`${window.location.origin}/collections/${collection.slug}`);
            toast.info("Đã sao chép link chia sẻ!");
        } else {
            toast.warn("Bộ sưu tập này chưa có link chia sẻ (cần được đặt công khai và có slug).");
        }
    };
    const handleEditClick = (e) => {
        e.stopPropagation();
        onEditCollection(collection);
    };

    const handleDeleteClick = (e) => {
        e.stopPropagation();
        onDeleteCollection(collection.id);
    };

    return (
        <div className={classNames("user-collection-card", { 'is-expanded': isExpanded })}>
            <div
                className="user-collection-card__header"
                onClick={() => setIsExpanded(!isExpanded)}
                role="button"
                tabIndex={0}
                aria-expanded={isExpanded}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setIsExpanded(!isExpanded); }}
            >

                <div className="user-collection-card__info">
                    <h6 className="user-collection-card__name" title={collection.name}>{collection.name}</h6>
                    <div className="user-collection-card__meta">
                        <span className={classNames("meta-badge", `type-${collection.type}`)}>{typeLabel}</span>
                        <span className="meta-separator">&bull;</span>
                        <span className={classNames("meta-badge", `visibility-${collection.isPublic ? 'public' : 'private'}`)}>
                            {collection.isPublic ? <><i className="fas fa-globe-americas icon-before-small"></i> Công khai</> : <><i className="fas fa-lock icon-before-small"></i> Riêng tư</>}
                        </span>
                        <span className="meta-separator">&bull;</span>
                        <span className="meta-item-count">{itemCount} mục</span>
                    </div>
                </div>
                <div className="user-collection-card__actions-header">
                    {collection.isPublic && collection.slug && (
                        <button className="btn-icon" onClick={copyShareLink} title="Sao chép link chia sẻ">
                            <i className="fas fa-share-alt"></i>
                        </button>
                    )}
                    <button className="btn-icon" onClick={handleEditClick} title="Sửa bộ sưu tập">
                        <i className="fas fa-edit"></i>
                    </button>
                    <button className="btn-icon btn-danger" onClick={handleDeleteClick} title="Xóa bộ sưu tập">
                        <i className="fas fa-trash"></i>
                    </button>
                    <span className={classNames("expansion-indicator", { 'expanded': isExpanded })}>
                        <i className="fas fa-chevron-down"></i>
                    </span>
                </div>
            </div>

            {isExpanded && (
                <div className="user-collection-card__body">
                    {collection.description && (
                        <p className="collection-description">
                            <i className="fas fa-info-circle icon-before-small text-muted"></i> {collection.description}
                        </p>
                    )}

                    <div className="collection-items-list">
                        {itemCount > 0 ? (
                            items.map(item => (
                                <div key={`${collection.type}-${item.id}`} className="collection-item-entry">
                                    {collection.type === 'movie' ? (
                                        <SingleFilmHorizontal
                                            movie={item}
                                            onRemove={() => onRemoveItem(collection.id, item.id, 'movie')}
                                            showRemoveButton={true}
                                        />
                                    ) : collection.type === 'comic' ? (
                                        <SingleComicHorizontal
                                            comic={item}
                                            onRemove={() => onRemoveItem(collection.id, item.id, 'comic')}
                                            showRemoveButton={true}
                                        />
                                    ) : null}
                                </div>
                            ))
                        ) : (
                            <p className="no-items-message">
                                <i className="fas fa-folder-open icon-before"></i>
                                Bộ sưu tập này hiện đang trống.
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
});

export default CollectionCardUser;
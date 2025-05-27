import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';

import Camera from './camera.jpg';
// import styles from './green-flag.css';

const ArImporter = function (props) {
    const {
        className,
        onClick,
        title,
        ...componentProps
    } = props;
    return (
        <img
            className={classNames(
                className
            )}
            draggable={false}
            src={Camera}
            alt="AR Importer"
            style={{width: '35px', height: '35px'}}
            title={title}
            onClick={onClick}
            {...componentProps}
        />
    );
};
ArImporter.propTypes = {
    active: PropTypes.bool,
    className: PropTypes.string,
    onClick: PropTypes.func.isRequired,
    title: PropTypes.string
};
ArImporter.defaultProps = {
    active: false,
    title: 'Go'
};
export default ArImporter;

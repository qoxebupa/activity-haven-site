<?php
add_action( 'wp_enqueue_scripts', function () {
	wp_enqueue_style( 'ah-parent-style', get_template_directory_uri() . '/style.css' );
	wp_enqueue_style(
		'ah-child-style',
		get_stylesheet_uri(),
		array( 'ah-parent-style' ),
		wp_get_theme()->get( 'Version' )
	);
} );

/**
 * Work out how to embed a program's video field.
 * Supports direct video files, YouTube links, and Google Drive links.
 * Falls back to a plain link for anything else.
 */
function ah_render_program_video( $url ) {
	if ( empty( $url ) ) {
		return '';
	}

	$url = trim( $url );

	// Direct video file (mp4, webm, mov).
	if ( preg_match( '/\.(mp4|webm|mov)(\?.*)?$/i', $url ) ) {
		return '<div class="ah-detail-video"><video src="' . esc_url( $url ) . '" autoplay muted loop playsinline preload="metadata"></video></div>';
	}

	// YouTube.
	if ( preg_match( '/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([A-Za-z0-9_-]{6,})/', $url, $m ) ) {
		$id = $m[1];
		$src = 'https://www.youtube.com/embed/' . esc_attr( $id ) . '?autoplay=1&mute=1&loop=1&playlist=' . esc_attr( $id );
		return '<div class="ah-detail-video"><iframe src="' . esc_url( $src ) . '" allow="autoplay; encrypted-media" allowfullscreen></iframe></div>';
	}

	// Google Drive.
	if ( preg_match( '/drive\.google\.com\/file\/d\/([^\/]+)/', $url, $m ) ) {
		$src = 'https://drive.google.com/file/d/' . esc_attr( $m[1] ) . '/preview';
		return '<div class="ah-detail-video"><iframe src="' . esc_url( $src ) . '" allow="autoplay"></iframe></div>';
	}

	// Fallback: plain link.
	return '<p><a href="' . esc_url( $url ) . '">Watch video</a></p>';
}

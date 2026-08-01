<?php
get_header();

while ( have_posts() ) : the_post();
	$day     = get_field( 'day' );
	$time    = get_field( 'time' );
	$room    = get_field( 'room' );
	$type    = get_field( 'type' );
	$status  = get_field( 'status' );
	$video   = get_field( 'video' );
	$leader  = get_field( 'leader' );
	$notice  = get_field( 'notice' );
	$desc    = get_field( 'description' );
	?>

	<main id="primary" class="site-main ah-program-single">
		<div class="entry-content" style="max-width: 720px; margin: 0 auto; padding: 20px;">

			<?php echo ah_render_program_video( $video ); ?>

			<span class="ah-badge"><?php echo esc_html( trim( $day . ' · ' . $time . ' · Room ' . $room ) ); ?></span>
			<?php if ( ! empty( $status ) ) : ?>
				<span class="ah-status-badge"><?php echo esc_html( $status ); ?></span>
			<?php endif; ?>

			<h1><?php the_title(); ?></h1>

			<?php if ( ! empty( $leader ) ) : ?>
				<p class="ah-detail-leader">Led by <?php echo esc_html( $leader ); ?></p>
			<?php endif; ?>

			<?php if ( ! empty( $notice ) ) : ?>
				<div class="ah-notice-box">
					<div>
						<strong>Notice</strong>
						<?php echo esc_html( $notice ); ?>
					</div>
				</div>
			<?php endif; ?>

			<?php if ( ! empty( $desc ) ) : ?>
				<p class="ah-detail-desc"><?php echo esc_html( $desc ); ?></p>
			<?php endif; ?>

			<p><a href="<?php echo esc_url( get_post_type_archive_link( 'program' ) ); ?>">&larr; Back to all programs</a></p>

		</div>
	</main>

<?php endwhile;

get_footer();

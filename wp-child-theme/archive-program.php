<?php
get_header();
?>

<main id="primary" class="site-main ah-programs-archive">
	<div class="entry-content" style="max-width: 1000px; margin: 0 auto; padding: 20px;">
		<h1>Drop-in programs</h1>
		<p>Select any class for the full description, video, instructor, and today's notices.</p>

		<div class="ah-program-grid">
			<?php if ( have_posts() ) : ?>
				<?php while ( have_posts() ) : the_post();
					$day  = get_field( 'day' );
					$time = get_field( 'time' );
					$room = get_field( 'room' );
					$type = get_field( 'type' );
					?>
					<a class="ah-program-card" href="<?php the_permalink(); ?>">
						<span class="ah-badge"><?php echo esc_html( trim( $day . ' · ' . $time ) ); ?></span>
						<h3><?php the_title(); ?></h3>
						<p><?php echo esc_html( trim( 'Room ' . $room . ' · ' . $type ) ); ?></p>
					</a>
				<?php endwhile; ?>
			<?php else : ?>
				<p>No programs are listed yet.</p>
			<?php endif; ?>
		</div>

		<?php the_posts_pagination(); ?>
	</div>
</main>

<?php get_footer(); ?>

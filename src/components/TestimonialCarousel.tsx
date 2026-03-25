 
import { useEffect } from 'react';

type Testimonial = {
  quote: string;
  name: string;
  role: string;
};

const testimonials: Testimonial[] = [
  {
    quote:
      'Easy Coders helped me move from basics to building real-world projects confidently.',
    name: 'Aarav Sharma',
    role: 'Frontend Developer',
  },
  {
    quote:
      'The learning approach is practical and industry-focused. Highly recommended!',
    name: 'Priya Verma',
    role: 'Computer Science Student',
  },
  {
    quote:
      'Clear explanations, hands-on coding, and great mentorship. Highly recommended!',
    name: 'Rahul Singh',
    role: 'Backend Developer',
  },
];

export default function TestimonialCarousel() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const anyWindow = window as any;

    const tryInit = () => {
      const $ = anyWindow.jQuery || anyWindow.$;
      if (!$ || !$.fn || !$.fn.owlCarousel) {
        // Owl not ready yet, try again shortly
        setTimeout(tryInit, 200);
        return;
      }

      const $carousel = $('.testimonial-owl');

      if ($carousel.length && !$carousel.data('owl-initialized')) {
        $carousel.data('owl-initialized', true);

        $carousel.owlCarousel({
          items: 1,
          loop: true,
          margin: 10,
          nav: true,
          dots: false,
          autoplay: true,
          autoplayTimeout: 4000,
          smartSpeed: 600,
          responsive: {
            0: {
              items: 1,
              stagePadding: 0,
            },
            576: {
              items: 1,
              stagePadding: 20,
            },
            768: {
              items: 1,
              stagePadding: 40,
            },
            992: {
              items: 1,
              stagePadding: 80,
            },
            1200: {
              items: 1,
              margin: 50,
              stagePadding: 120,
            },
          },
        });
      }
    };

    tryInit();
  }, []);

  return (
    <div className="testimonialCarousel">
      <div className="testimonial-owl owl-carousel owl-theme">
        {testimonials.map((item, index) => (
          <div className="item" key={index}>
            <div className="testimonialCard">
              <p className="testimonialText">“{item.quote}”</p>
              <div className="testimonialName">{item.name}</div>
              <div className="testimonialRole">{item.role}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

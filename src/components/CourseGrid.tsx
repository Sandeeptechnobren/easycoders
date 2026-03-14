'use client'
import Link from "next/link";

type Course = {
  id: number | string;
  level: string;
  image: string;
  title: string;
  rating: string | number;
  views: string | number;
};

type CourseGridProps = {
  filteredCourses: Course[];
};

export default function CourseGrid({ filteredCourses }: CourseGridProps) {
  return (
    <div className="cardGrid">
      {filteredCourses.length > 0 ? (
        filteredCourses.map((course) => (
          
          <div className="courseCardBlock" key={course.id}>
              <span className="badge">{course.level}</span>
            <div className="cardImage">
              <img src={course.image} alt={course.title} />
            
            </div>
            <div className="courseCard">
              

              <h3 className="cardTitle">{course.title}</h3>
              <p className="cardDescp">Learn to build secure, scalable, and high-performance web.</p>

              <div className="rating">
               <i className="icon-star"></i> {course.rating}
              </div>

              <div className="courFlex">
              <span className="duration"><i className="icon icon-clock"></i> 4hrs</span>

<span className="views"><i className="icon icon-eye"></i> {course.views}</span>
                </div>

              <Link href="/courses" className="btn btn-default enrollBtn btn-sm">
                View Course
              </Link>
            </div>
          </div>
        ))
      ) : (
        <div className="text-center w-full py-10 opacity-50">
          <h3>No courses found matches your criteria.</h3>
        </div>
      )}
    </div>
  );
}
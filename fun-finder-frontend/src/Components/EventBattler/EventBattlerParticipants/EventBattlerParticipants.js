import React, { useEffect, useState } from "react";
import "./EventBattlerParticipants.css";
import ActiveCircle from "../../ActiveCircle/ActiveCircle";

function EventBattlerParticipants({participants}) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userData = await Promise.all(
          participants.map(async (participant) => {
            const response = await fetch(`http://localhost:7000/users/user-data-id/${participant}`);
            const data = await response.json();
            return {
              email: data.email,
              fname: data.fname,
              lname: data.lname,
              avatar: data.avatar,
            };
          })
        );
        setUsers(userData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [participants]);

  if (loading) {
    // return <p>Loading...</p>;
  }

  return (
    <div className="event-battler-participants-container">
      <ul>
        {loading ? (
          null
        ) : (
          users.map((user, index) => (
            <li key={index}>
              <div className="event-battler-participants-user-details">
                <div className="event-battler-participants-activeCircle">
                  <ActiveCircle isActive={true} />
                </div>
                <img src={user.avatar} alt="Avatar" />
                <a>{user.email}<br /></a>
                <a>{user.fname} {user.lname}</a>
              </div>
              <hr />
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

export default EventBattlerParticipants;

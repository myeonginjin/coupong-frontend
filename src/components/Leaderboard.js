import React, { useState, useEffect } from "react";
import { DOMAIN } from "../common/common";
import trophy from "./trophy.svg";
import Winner from "./Winner.svg";

// 카테고리 상수화
const CATEGORIES = ["CHICKEN", "COFFEE", "PIZZA"];

const LeaderboardScreen = () => {
    const [leaderboard, setLeaderboard] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[1]);
    const [message, setMessage] = useState("");
    const [eventSource, setEventSource] = useState(null);

    // 리더보드 데이터를 가져오는 함수
    const fetchLeaderboard = () => {
        fetch(`${DOMAIN}/sse/leaderboard?couponCategory=${selectedCategory}`)
            .then((response) => {
                if (response.ok) {
                    return response.json();
                }
                throw new Error("Network response was not ok.");
            })
            .then((data) => {
                const winnersArray = data[selectedCategory] || [];
                setLeaderboard(winnersArray);
                setMessage(winnersArray.length === 0 ? "아직 당첨자가 없습니다." : "");
            })
            .catch((error) => {
                console.error("Error fetching leaderboard:", error);
                setLeaderboard([]);
                setMessage("아직 당첨자가 없습니다.");
            });
    };

    useEffect(() => {
        // SSE 연결 설정
        const createEventSource = () => {
            const source = new EventSource(`${DOMAIN}/sse/leaderboard/stream?couponCategory=${selectedCategory}`, { withCredentials: true });
            console.log("EventSource created:", source);
            setEventSource(source);

            source.onopen = () => {
                console.log("EventSource connection opened, readyState:", source.readyState);
                setMessage(""); // 연결이 성공적으로 열렸을 때 메시지를 초기화
            };

            source.onmessage = (event) => {
                console.log("Received message:", event.data);

                if (event.data.trim() === '') {
                    console.warn("Received an empty message");
                    return; // 메시지가 비어있는 경우 종료
                }

                try {
                    const jsonData = JSON.parse(event.data);
                    console.log("Parsed JSON data:", jsonData);

                    // 카테고리 체크
                    if (jsonData.couponCategory === selectedCategory) {
                        const winnersArray = jsonData.winners || [];

                        // 빈 문자열 필터링
                        const validWinners = winnersArray.filter(winner => winner.trim() !== "");

                        // 상태 업데이트 최적화
                        if (validWinners.length !== leaderboard.length || validWinners.some((winner, index) => winner !== leaderboard[index])) {
                            setLeaderboard(validWinners);
                            setMessage(validWinners.length === 0 ? "아직 당첨자가 없습니다." : "");
                        }
                    }
                } catch (error) {
                    console.error("Failed to parse JSON:", error);
                }
            };

            source.onerror = (error) => {
                console.error("EventSource failed:", error);
                setMessage("리더보드 업데이트를 받을 수 없습니다.");
                if (source.readyState === EventSource.CLOSED) {
                    console.log("EventSource closed, attempting to reconnect...");
                    setEventSource(null);
                    setTimeout(createEventSource, 3000);  // 3초 후 재연결 시도
                }
            };
        };

        // 초기 데이터 로딩 및 SSE 연결
        fetchLeaderboard();
        createEventSource();

        // 컴포넌트 언마운트 시 SSE 연결 종료
        return () => {
            if (eventSource) {
                eventSource.close();
                console.log("EventSource closed");
            }
        };
    }, [selectedCategory]); // selectedCategory가 변경될 때마다 새로운 SSE 연결 생성

    const handleCategoryChange = (event) => {
        if (eventSource) {
            eventSource.close(); // 이전 SSE 연결 종료
        }
        setSelectedCategory(event.target.value); // 카테고리 변경 후 새 연결
    };

    return (
        <div style={containerStyle}>
            <div style={titleContainerStyle}>
                <img src={trophy} alt="Winner Icon" style={logo} />
                <img src={Winner} alt="Winner" style={logo} />
            </div>

            <div style={formControlContainer}>
                <label htmlFor="category-select" style={labelStyle}>카테고리 선택</label>
                <select
                    id="category-select"
                    value={selectedCategory}
                    onChange={handleCategoryChange}
                    style={selectStyle}
                >
                    {CATEGORIES.map((category) => (
                        <option key={category} value={category}>
                            {category}
                        </option>
                    ))}
                </select>
            </div>

            <div style={scrollContainerStyle}>
                <ul style={listStyle}>
                    {leaderboard.map((item, index) => (
                        <li key={index} style={listItemStyle}>
                            <span style={textStyle}>
                                축하합니다!
                                <br /> {item} 님께서 {selectedCategory} 응모에
                                <br /> 당첨되셨습니다!
                            </span>
                        </li>
                    ))}
                </ul>
                {message && (
                    <div style={{ textAlign: "center", marginTop: "20px", color: "#000000" }}>
                        {message}
                    </div>
                )}
            </div>
        </div>
    );
};

// 인라인 스타일링
const formControlContainer = {
    width: "250px",
    margin: "20px 10px 20px 15px",
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
};

const labelStyle = {
    marginBottom: "10px",
    fontWeight: "bold",
    color: "#333",
};

const selectStyle = {
    padding: "10px",
    borderRadius: "5px",
    border: "1px solid #d9d9d9",
    fontSize: "16px",
};

const containerStyle = {
    backgroundColor: "#FFFFFF",
    width: "25%",
    height: "100%",
    borderRight: "2px solid #d9d9d9",
    padding: "0px",
};

const titleContainerStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "left",
    backgroundColor: "#377fee",
    borderRadius: "0px 0px 10px 10px",
    height: "7%",
    width: "100%",
};

const scrollContainerStyle = {
    width: "100%",
    height: "calc(100% - 150px)",
    overflowY: "auto",
    margin: "0px 10px 20px 15px",
};

const listStyle = {
    padding: 0,
    width: "250px",
    margin: 0,
};

const logo = {
    marginLeft: "10px",
};

const listItemStyle = {
    backgroundColor: "#f5f5f5",
    borderRadius: "20px",
    padding: "10px",
    marginBottom: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
};

const textStyle = {
    color: "#333",
    fontSize: "16px",
};

export default LeaderboardScreen;

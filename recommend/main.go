package main

import (
	"fmt"
	"net/http"
	"encoding/json"
	r "github.com/dancannon/gorethink"
)
// All code with same package in the same folder is auto imported

var conn *r.Session

func recomendHandler(w http.ResponseWriter, req *http.Request) {
	email := req.FormValue("email")

	ourPerson := map[string]int{}
	items, _ := r.Table("comments").Filter(r.Row.Field("email").Eq(email)).Run(conn)
	for items.Next() {
		var item DBRating
		_ = items.Scan(&item)

		ourPerson[item.BundleId] = item.Rating
	}

	c, rec := DoRecommendation(ourPerson, email, conn)
	respObj := JSONResponce{
		Confidence: c,
		Recommendations: rec,
	}
	respJ, _ := json.Marshal(respObj)
	fmt.Fprintln(w, string(respJ))
}

func StartServer(c *r.Session) {
	conn = c

	http.HandleFunc("/recommend", recomendHandler)
	http.ListenAndServe(":5002", nil)
}

func main() {
	conn, _ := r.Connect(r.ConnectOpts{
		Address:  "localhost:28015",
		Database: "comments",
	})

	StartServer(conn)

	/* BundleId to rating
	ourPerson := map[string]int{
		"org.sugarlabs.browse.or.whatever": 5,
	}
	fmt.Println(DoRecommendation(ourPerson, "sam@sugarlabs.org", conn))*/
}

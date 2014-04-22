package main

import (
	r "github.com/dancannon/gorethink"
	"sort"
)

func prepPerson(email string, mainPerson map[string]int, peopleChan chan Person, conn *r.Session) {
	p := Person{Id: email}

	items, _ := r.Table("comments").Filter(r.Row.Field("email").Eq(email)).Run(conn)
	for items.Next() {
		var item DBRating
		items.Scan(&item)

		_, ok := mainPerson[item.BundleId]
		if !ok {
			p.AddRecommendation(item.BundleId)
		} else {
			ourRating := mainPerson[item.BundleId]
			theirRating := item.Rating

			if (ourRating >= 4 && theirRating >= 4) || (ourRating <= 4 && theirRating <= 4) {
				p.NumSame++
			} else {
				p.NumConflict++
			}
		}
	}

	p.CalcMagic()
	peopleChan <- p
}

func DoRecommendation(ourPerson map[string]int, email string, conn *r.Session) []MagicId {
	peopleChan := make(chan Person)
	peopleToGo := 0

	query := r.Table("comments").Filter(r.Row.Field("email").Ne(email))
	emails, _ := query.Pluck("email").Distinct().Run(conn)
	for emails.Next() {
		var emailObj JustEmail
		emails.Scan(&emailObj)

		go prepPerson(emailObj.Email, ourPerson, peopleChan, conn)
		peopleToGo++
	}

	magicValues := map[string]float64{}
	magicTotals := map[string]float64{}

	for peopleToGo > 0 {
		p := <-peopleChan
		peopleToGo--

		for _, v := range p.Recommend {
			magicTotals[v]++
			magicValues[v] += p.MagicNum
		}
	}

	list := []MagicId{}
	for id, v := range magicValues {
		t := magicTotals[id]
		avg := v/t
		list = append(list, MagicId{Magic: avg, Id: id})
	}

	sort.Sort(ByMagic(list))

	return list
}

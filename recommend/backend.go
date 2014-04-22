package main

import (
     r "github.com/dancannon/gorethink"
)

func DoRecommendation(ourPerson map[string]int, email string, conn *r.Session) (float64, []string) {
	peopleById := map[string]*Person{}

	items, _ := r.Table("comments").Filter(r.Row.Field("email").Ne(email)).Run(conn)
	for items.Next() {
		var item DBRating
		items.Scan(&item)

		_, ok := ourPerson[item.BundleId]
		if !ok {
			_, ok := peopleById[item.Email]
			if !ok {
				peopleById[item.Email] = makePerson(item.Email)
			}
			p := peopleById[item.Email]

			p.AddRecommendation(item.BundleId)
		} else {
			ourRating := ourPerson[item.BundleId]
			theirRating := item.Rating

			_, ok := peopleById[item.Email]
			if !ok {
				peopleById[item.Email] = makePerson(item.Email)
			}
			p := peopleById[item.Email]

			if (ourRating >= 3 && theirRating >= 3) || (ourRating <= 3 && theirRating <= 3) {
				p.NumSame++
			} else {
				p.NumConflict--
			}
		}
	}

	var highestMagic float64
	var highestRecommendation []string

	for _, v := range peopleById {
		v.CalcMagic()
		if v.MagicNum > highestMagic {
			highestMagic = v.MagicNum
			highestRecommendation = v.Recommend
		}
	}

	return highestMagic, highestRecommendation
}
